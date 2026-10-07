export type Todo = { id: number; title: string; completed: boolean; };
export type DatabaseSchema = { todos: Todo[]; };

export type Method =
  | "todo:list"
  | "todo:get"
  | "todo:create"
  | "todo:update"
  | "todo:delete";

export type NewTodo = Pick<Todo, "title" | "completed">;
export type UpdateTodo = Partial<Todo>;

export type JsonRpcId = string | number | null;

export type JsonRpcError<TData = unknown> = {
  code: number;
  message: string;
  data?: TData;
};

export type JsonRpcSuccess<TResult> = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: TResult;
  error?: never;
};

export type JsonRpcFailure = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: never;
  error: JsonRpcError;
};

export type JsonRpcRequest<TParams = Record<string, unknown> | unknown[]> = {
  jsonrpc: "2.0";
  method: Method;
  params?: TParams;
  id?: JsonRpcId;
};

export type JsonRpcResponse<TResult> = JsonRpcSuccess<TResult> | JsonRpcFailure;




