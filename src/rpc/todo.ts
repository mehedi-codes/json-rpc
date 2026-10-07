import { Hono } from "hono";
import {
  type JsonRpcFailure,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcSuccess,
  type NewTodo,
  type UpdateTodo,
} from "../types/todo";
import { createTodo, deleteTodoById, getTodoById, getTodos, updateTodoById } from "../service/todo";
import { JsonRpcErrorCode } from "../error/error-code";
import { ValidationError } from "../error/validation-error";

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getParamId = (value: unknown): number | undefined => {
  return isObject(value) && typeof value.id === "number" && Number.isInteger(value.id)
    ? value.id
    : undefined;
};

const ok = <TResult>(result: TResult, id: JsonRpcId): JsonRpcSuccess<TResult> => ({
  jsonrpc: "2.0",
  result,
  id,
});

const fail = (id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcFailure => ({
  jsonrpc: "2.0",
  error: { code, message, data },
  id,
});

const router = new Hono();

router.post("/", async (c) => {
  const { method, id, params } = await c.req.json<JsonRpcRequest>();
  const requestId = id && id !== "" ? id : null;
  try {
    if (method === "todo:list") {
      const data = await getTodos();
      return c.json(ok(data, requestId));
    }

    if (method === "todo:create") {
      if (!isObject(params) || typeof params.title !== "string") {
        return c.json(
          fail(requestId, JsonRpcErrorCode.Invalid_Params, "params.title must be a string"),
        );
      }
      if (typeof params.completed !== "boolean") {
        return c.json(
          fail(requestId, JsonRpcErrorCode.Invalid_Params, "params.completed must be a boolean"),
        );
      }
      const data = await createTodo(params as NewTodo);
      return c.json(ok(data, requestId));
    }

    const todoId = getParamId(params);
    if (todoId === undefined) {
      return c.json(
        fail(requestId, JsonRpcErrorCode.Invalid_Params, "params.id must be an integer"),
      );
    }

    if (method === "todo:get") {
      const data = await getTodoById(todoId);
      if (!data) {
        return c.json(
          fail(requestId, JsonRpcErrorCode.Resource_Not_Found, `Todo ${todoId} not found`),
        );
      }
      return c.json(ok(data, requestId));
    }

    if (method === "todo:delete") {
      const data = await deleteTodoById(todoId);
      if (!data) {
        return c.json(
          fail(
            requestId,
            JsonRpcErrorCode.Resource_Not_Found,
            `Todo ${todoId} was not deleted successfully.`,
          ),
        );
      }
      return c.json(ok(data, requestId));
    }

    if (method === "todo:update") {
      if (isObject(params) && params.title !== undefined && typeof params.title !== "string") {
        return c.json(
          fail(requestId, JsonRpcErrorCode.Invalid_Params, "params.title must be a string"),
        );
      }
      if (
        isObject(params) &&
        params.completed !== undefined &&
        typeof params.completed !== "boolean"
      ) {
        return c.json(
          fail(requestId, JsonRpcErrorCode.Invalid_Params, "params.completed must be a boolean"),
        );
      }
      const data = await updateTodoById(todoId, params as UpdateTodo);
      if (!data) {
        return c.json(
          fail(
            requestId,
            JsonRpcErrorCode.Resource_Not_Found,
            `Todo ${todoId} was not updated successfully.`,
          ),
        );
      }

      return c.json(ok(data, requestId));
    }

    return c.json(fail(requestId, JsonRpcErrorCode.Method_Not_Found, "Method not found"));
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json(fail(requestId, JsonRpcErrorCode.Invalid_Params, error.message));
    }
    throw error;
  }
});

export const rpcHandler = router;
