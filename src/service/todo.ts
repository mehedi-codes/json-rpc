import { ValidationError } from "../error/validation-error";
import { db } from "../shared/db";
import { type NewTodo, type UpdateTodo, type Todo } from "../types/todo";

const assertTitle = (title: string) => {
  if (title.trim() === "") {
    throw new ValidationError("title must be a non-empty string");
  }
};

export const getTodos = async () => {
  const { todos } = await db.read();
  return todos;
};

export const getTodoById = async (id: number) => {
  const { todos } = await db.read();
  const todo = todos.find((todo) => todo.id === id);
  return todo;
};

export const createTodo = async (todo: NewTodo) => {
  assertTitle(todo.title);
  const { todos } = await db.read();
  const nextId = todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
  const newTodo: Todo = { id: nextId, title: todo.title, completed: todo.completed };
  await db.write({ todos: [...todos, newTodo] });
  return newTodo;
};

export const updateTodoById = async (id: number, updatedTodo: UpdateTodo) => {
  if (updatedTodo.title !== undefined) {
    assertTitle(updatedTodo.title);
  }
  const { todos } = await db.read();
  const oldTodo = todos.find((todo) => todo.id === id);
  if (!oldTodo) return undefined;
  if (updatedTodo.title !== undefined && oldTodo.title !== updatedTodo.title) {
    oldTodo.title = updatedTodo.title;
  }
  if (updatedTodo.completed !== undefined && oldTodo.completed !== updatedTodo.completed) {
    oldTodo.completed = updatedTodo.completed;
  }
  await db.write({ todos });
  return oldTodo;
};

export const deleteTodoById = async (id: number) => {
  const { todos } = await db.read();
  const todo = todos.find((todo) => todo.id === id);
  if (todo) {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    await db.write({ todos: updatedTodos });
  }
  return todo;
};
