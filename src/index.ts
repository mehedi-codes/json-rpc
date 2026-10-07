import { Hono } from "hono";
import { rpcHandler } from "./rpc/todo";
import { todoRoutes } from "./rest/todo";
import { Scalar } from "@scalar/hono-api-reference";
import openapi from "./rest/openapi.json";
import openrpc from "./rpc/openrpc.json";
import { openrpcToOpenApi } from "./rpc-to-openapi";
import { JsonRpcErrorCode } from "./error/error-code";

const app = new Hono();

app.get("/", (c) => {
  const memoryUsage = process.memoryUsage();
  return c.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(2) + "s",
    bunVersion: Bun.version,
    memory: {
      heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
      rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
    },
  });
});

// Raw specs
app.get("/openapi.json", (c) => c.json(openapi));
app.get("/openrpc.json", (c) => c.json(openrpc));

// Scalar UI for REST
app.route(
  "/docs",
  Scalar.serve({
    pageTitle: "Todo REST API Docs",
    document: openapi,
  }),
);

// Scalar UI for JSON-RPC (pseudo-REST OpenAPI)
const rpcOpenApi = openrpcToOpenApi(openrpc);
app.route(
  "/docs/rpc",
  Scalar.serve({
    pageTitle: "Todo JSON-RPC API Docs",
    document: rpcOpenApi,
  }),
);

app.post("/rpc/:method", async (c) => {
  const method = c.req.param("method");
  const body = await c.req.json();

  const isJsonRpcRequest = body && typeof body === "object" && "jsonrpc" in body;
  const modifiedBody = isJsonRpcRequest
    ? { ...body, method }
    : { jsonrpc: "2.0", method, params: body, id: null };

  return rpcHandler.fetch(
    new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modifiedBody),
    }),
  );
});

app.route("/todos", todoRoutes);
app.route("/rpc", rpcHandler);

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: c.req.method + " " + c.req.path,
      data: [],
    },
    404,
  );
});

app.onError(async (error, c) => {
  const message = error instanceof Error ? error.message : String(error);
  if (c.req.path === "/rpc" || c.req.path.startsWith("/rpc/")) {
    let requestId: string | number | null = null;
    try {
      const body = await c.req.json();
      requestId = body.id && body.id !== "" ? body.id : null;
    } catch {
      requestId = null;
    }
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: JsonRpcErrorCode.Internal_Error, message: "Internal Error", data: message },
        id: requestId,
      },
      500,
    );
  }
  return c.json({ success: false, message, data: [] }, 500);
});

export default app;
