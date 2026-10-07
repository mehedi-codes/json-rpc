import { Hono } from "hono";
import type { NewTodo, UpdateTodo } from "../types/todo";
import { createTodo, deleteTodoById, getTodoById, getTodos, updateTodoById } from "../service/todo";

const router = new Hono();

router
  .get("/", async (c) => {
    const data = await getTodos();
    const statusCode = data.length > 0 ? 200 : 404;
    const message = data.length > 0 ? "Todos fetched successfully" : "No todos found";
    return c.json({ success: !!data.length, message, data }, statusCode);
  })
  .get("/:id", async (c) => {
    const paramId = c.req.param("id");
    const todoId = Number(paramId);
    if (Number.isNaN(todoId)) {
      return c.json(
        {
          success: false,
          message: "Invalid ID format. ID must be a number.",
          data: [],
        },
        400,
      );
    }
    const data = await getTodoById(todoId);
    const statusCode = data ? 200 : 404;
    const message = data
      ? `Todo with id ${todoId} fetched successfully`
      : `Todo with id ${todoId} not found`;
    return c.json({ success: !!data, message, data: data ? [data] : [] }, statusCode);
  })
  .post("/", async (c) => {
    let body: NewTodo;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: "Invalid JSON body", data: [] }, 400);
    }
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return c.json({ success: false, message: "title is required", data: [] }, 400);
    }
    const data = await createTodo(body);
    return c.json(
      {
        success: true,
        message: "Todo created successfully",
        data: data ? [data] : [],
      },
      201,
    );
  })
  .patch("/:id", async (c) => {
    const paramId = c.req.param("id");
    const todoId = Number(paramId);
    if (Number.isNaN(todoId)) {
      return c.json(
        {
          success: false,
          message: "Invalid ID format. ID must be a number.",
          data: [],
        },
        400,
      );
    }
    let body: UpdateTodo;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: "Invalid JSON body", data: [] }, 400);
    }
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim() === "") {
        return c.json(
          { success: false, message: "title must be a non-empty string", data: [] },
          400,
        );
      }
    }
    if (body.completed !== undefined) {
      if (typeof body.completed !== "boolean") {
        return c.json({ success: false, message: "completed must be a boolean", data: [] }, 400);
      }
    }
    const data = await updateTodoById(todoId, body);
    const statusCode = data ? 200 : 404;
    const message = data
      ? `Todo with id ${todoId} updated successfully`
      : `Todo with id ${todoId} not found`;
    return c.json({ success: !!data, message, data: data ? [data] : [] }, statusCode);
  })
  .delete("/:id", async (c) => {
    const paramId = c.req.param("id");
    const todoId = Number(paramId);
    if (Number.isNaN(todoId)) {
      return c.json(
        {
          success: false,
          message: "Invalid ID format. ID must be a number.",
          data: [],
        },
        400,
      );
    }
    const data = await deleteTodoById(todoId);
    const statusCode = data ? 200 : 404;
    const message = data
      ? `Todo with id ${todoId} deleted successfully`
      : `Todo with id ${todoId} not found`;
    return c.json({ success: !!data, message, data: data ? [data] : [] }, statusCode);
  });

export const todoRoutes = router;
