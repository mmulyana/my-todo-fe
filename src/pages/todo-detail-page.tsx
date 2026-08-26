import { useNavigate, useParams } from "react-router-dom";
import { DetailPaneContent } from "../components/detail-pane";

export default function TodoDetailPage() {
  const { todoId } = useParams();
  const navigate = useNavigate();

  if (!todoId) return null;

  return (
    <main className="flex-1 min-w-0 flex flex-col gap-4 min-h-0 overflow-y-auto bg-surface border border-line rounded-2xl shadow-sm">
      <DetailPaneContent todoId={todoId} onClose={() => navigate(-1)} />
    </main>
  );
}
