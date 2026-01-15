import React, { useEffect, useMemo, useState } from "react";
import { Check, X, Star, Plus, Filter, Search } from "lucide-react";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  Todo,
} from "../api/todos";

type FilterType = "all" | "active" | "completed" | "important";

const InteractiveTodoApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  /* ---------------- FETCH TODOS ---------------- */
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const data = await fetchTodos();
        setTodos(data);
      } catch (error) {
        console.error("Failed to fetch todos", error);
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, []);

  /* ---------------- CREATE TODO ---------------- */
  const addTodo = async () => {
    if (!title.trim()) return;

    try {
      const newTodo = await createTodo({
        title,
        description,
        isImportant,
        isCompleted: false,
      });

      setTodos((prev) => [newTodo, ...prev]);
      setTitle("");
      setDescription("");
      setIsImportant(false);
      setIsFormExpanded(false);
    } catch (error) {
      console.error("Failed to create todo", error);
    }
  };

  /* ---------------- UPDATE TODO ---------------- */
  const toggleComplete = async (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      const updated = await updateTodo(id, {
        isCompleted: !todo.isCompleted,
      });

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch (error) {
      console.error("Failed to update todo", error);
    }
  };

  const toggleImportant = async (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      const updated = await updateTodo(id, {
        isImportant: !todo.isImportant,
      });

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch (error) {
      console.error("Failed to update todo", error);
    }
  };
  const handleDeleteTodo = async (id: number) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete todo", error);
    }
  };

  const filteredTodos = useMemo(() => {
    let filtered = [...todos];

    if (searchQuery) {
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (todo.description ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    switch (filter) {
      case "active":
        return filtered.filter((t) => !t.isCompleted);
      case "completed":
        return filtered.filter((t) => t.isCompleted);
      case "important":
        return filtered.filter((t) => t.isImportant);
      default:
        return filtered;
    }
  }, [todos, filter, searchQuery]);

  /* ---------------- STATS ---------------- */
  const stats = useMemo(
    () => ({
      total: todos.length,
      active: todos.filter((t) => !t.isCompleted).length,
      completed: todos.filter((t) => t.isCompleted).length,
      important: todos.filter((t) => t.isImportant).length,
    }),
    [todos]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading todos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Todo List
          </h1>
          <p className="text-gray-600 mt-2">
            Stay organized and productive
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(stats).map(([key, value]) => (
            <div
              key={key}
              className="bg-white rounded-xl p-4 shadow-sm border"
            >
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs uppercase text-gray-500">
                {key}
              </div>
            </div>
          ))}
        </div>

        {/* Add Todo */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {!isFormExpanded ? (
            <button
              onClick={() => setIsFormExpanded(true)}
              className="w-full flex justify-center items-center gap-2 text-purple-600"
            >
              <Plus size={20} /> Add New Todo
            </button>
          ) : (
            <div className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Todo title"
                className="w-full border rounded-xl px-4 py-3"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full border rounded-xl px-4 py-3"
                rows={2}
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                />
                <Star size={16} />
                Important
              </label>

              <div className="flex justify-end gap-2">
                <button onClick={() => setIsFormExpanded(false)}>
                  Cancel
                </button>
                <button
                  onClick={addTodo}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(["all", "active", "completed", "important"] as FilterType[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-white border"
                }`}
              >
                {f}
              </button>
            )
          )}
        </div>

        {/* Todos */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl">
              <Filter size={40} className="mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">No todos found</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-xl p-4 flex items-start gap-4"
              >
                <button onClick={() => toggleComplete(todo.id)}>
                  {todo.isCompleted && <Check />}
                </button>

                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      todo.isCompleted && "line-through text-gray-400"
                    }`}
                  >
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p className="text-sm text-gray-600">
                      {todo.description}
                    </p>
                  )}
                </div>

                <button onClick={() => toggleImportant(todo.id)}>
                  <Star
                    className={
                      todo.isImportant
                        ? "fill-amber-500 text-amber-500"
                        : ""
                    }
                  />
                </button>

                <button onClick={() => handleDeleteTodo(todo.id)}>
                  <X />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveTodoApp;
