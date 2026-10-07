import type openrpc from "./rpc/openrpc.json";

type OpenRpc = typeof openrpc;

type JsonSchema = Record<string, unknown>;

type OpenRpcParam = {
  name: string;
  schema?: JsonSchema;
  required?: boolean;
  [key: string]: unknown;
};

type OpenRpcMethod = {
  name: string;
  summary?: string;
  description?: string;
  tags?: Array<{ name: string; description?: string }>;
  params?: OpenRpcParam[];
  [key: string]: unknown;
};

type OpenRpcSpec = OpenRpc & {
  info: {
    title: string;
    description?: string;
    version: string;
    [key: string]: unknown;
  };
  methods?: OpenRpcMethod[];
};

type OpenApiPathItem = Record<string, unknown>;
type OpenApiPaths = Record<string, OpenApiPathItem>;

export const openrpcToOpenApi = (openrpcSpec: OpenRpcSpec) => {
  const info = openrpcSpec.info;
  const paths: OpenApiPaths = {};

  const methods = Array.isArray(openrpcSpec.methods) ? openrpcSpec.methods : [];

  for (const method of methods) {
    const methodName = method.name;
    const path = "/rpc/" + methodName;
    const params = Array.isArray(method.params) ? method.params : [];

    const bodySchema: JsonSchema = {
      type: "object",
      required: ["jsonrpc", "id", "method"],
      properties: {
        jsonrpc: { type: "string", enum: ["2.0"], default: "2.0" },
        id: {
          oneOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
        },
        method: { type: "string", enum: [methodName], default: methodName },
        params: {
          oneOf: [{ type: "object" }, { type: "array" }],
        },
      },
    };

    if (params.length > 0) {
      const pp: Record<string, JsonSchema> = {};
      const rq: string[] = [];

      for (const p of params) {
        if (p.name) {
          pp[p.name] = p.schema ?? { type: "object" };
          if (p.required) {
            rq.push(p.name);
          }
        }
      }

      if (Object.keys(pp).length > 0) {
        const paramsSchema: JsonSchema = {
          type: "object",
          properties: pp,
        };

        if (rq.length > 0) {
          paramsSchema.required = rq;
        }

        const bodyProps = bodySchema.properties as Record<string, unknown>;
        bodyProps.params = paramsSchema;
      }
    }

    const postOperation: Record<string, unknown> = {
      operationId: methodName,
      summary: method.summary ?? methodName,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: bodySchema,
          },
        },
      },
      responses: {
        "200": {
          description: "JSON-RPC response",
          content: {
            "application/json": {
              schema: {
                "": "#/components/schemas/JsonRpcResponse",
              },
            },
          },
        },
      },
    };

    if (method.description) {
      postOperation.description = method.description;
    }

    if (method.tags && method.tags.length > 0) {
      postOperation.tags = method.tags.map((t) => t.name);
    }

    paths[path] = {
      post: postOperation,
    };
  }

  return {
    openapi: "3.0.0",
    info: {
      title: info.title,
      description: info.description,
      version: info.version,
    },
    paths,
    components: {
      schemas: {
        JsonRpcError: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: { type: "integer" },
            message: { type: "string" },
            data: {},
          },
        },
        JsonRpcResponse: {
          type: "object",
          required: ["jsonrpc", "id"],
          properties: {
            jsonrpc: { type: "string", enum: ["2.0"] },
            id: {
              oneOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
            },
            result: {},
            error: {
              "": "#/components/schemas/JsonRpcError",
            },
          },
        },
      },
    },
  };
};
