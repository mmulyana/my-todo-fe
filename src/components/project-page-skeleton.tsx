import { Skeleton } from "@/components/ui/skeleton";
import { TodoListSkeleton } from "./todo-list-skeleton";

export function ProjectHeadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-3 pt-2" aria-hidden="true">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  );
}

function GroupHeaderSkeleton({ width }: { width: string }) {
  return (
    <div className="flex h-10 items-center gap-2 px-3" aria-hidden="true">
      <Skeleton className="h-5 w-5 rounded-md" />
      <Skeleton className={`h-4 ${width}`} />
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <div role="status" aria-label="Loading todos" className="flex flex-col">
      <GroupHeaderSkeleton width="w-24" />
      <TodoListSkeleton rows={4} />
      <GroupHeaderSkeleton width="w-20" />
    </div>
  );
}
