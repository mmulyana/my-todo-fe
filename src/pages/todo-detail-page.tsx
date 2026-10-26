import { useNavigate, useParams } from "react-router-dom";
import { DetailPaneContent } from "../components/detail-pane";

export default function TodoDetailPage() {
  const { todoId } = useParams();
  const navigate = useNavigate();

  if (!todoId) return null;

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden rounded-2xl border border-line bg-surface">
      <DetailPaneContent
        key={todoId}
        todoId={todoId}
        onClose={() => navigate(-1)}
        onOpenTodo={(id) => navigate(`/todo/${id}`)}
      />
    </main>
  );
}
