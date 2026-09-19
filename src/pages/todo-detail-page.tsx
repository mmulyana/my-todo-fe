import { useNavigate, useParams } from "react-router-dom";
import { DetailPane } from "../components/detail-pane";

export default function TodoDetailPage() {
  const { todoId } = useParams();
  const navigate = useNavigate();

  if (!todoId) return null;

  return (
    <DetailPane
      todoId={todoId}
      onClose={() => navigate(-1)}
      onOpenTodo={(id) => navigate(`/todo/${id}`)}
    />
  );
}
