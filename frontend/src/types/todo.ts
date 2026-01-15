export interface Todo {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  isImportant: boolean;
  createdAt: string;
}
