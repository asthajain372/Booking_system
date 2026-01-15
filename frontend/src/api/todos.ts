import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000"
});

export type Todo = {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
};

// Fetch all todos
export const fetchTodos = async (): Promise<Todo[]> => {
  const { data } = await api.get("/todos");
  return data;
};

// Create todo
export const createTodo = async (todo: Partial<Todo>) => {
  const { data } = await api.post("/todos", todo);
  return data;
};

// Update todo
export const updateTodo = async (id: number, todo: Partial<Todo>) => {
  const { data } = await api.put(`/todos/${id}`, todo);
  return data;
};

// Delete todo
export const deleteTodo = async (id: number) => {
  await api.delete(`/todos/${id}`);
};
