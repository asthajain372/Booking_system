import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
} from "../api/todos";
import { Todo } from "../types/todo";
import InteractiveTodoApp from "../components/InteractiveTodoApp";
export default function TodosPage() {
    const queryClient = useQueryClient();

    const { data: todos = [], isLoading } = useQuery({
        queryKey: ["todos"],
        queryFn: fetchTodos,
    });

    const createMutation = useMutation({
        mutationFn: createTodo,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Todo> }) =>
            updateTodo(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTodo,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
    });

    if (isLoading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    return (
     
        <div>
            <InteractiveTodoApp />
        </div>
    );
}

