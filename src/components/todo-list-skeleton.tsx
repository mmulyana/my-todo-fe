import { Skeleton } from "@/components/ui/skeleton";

const TITLE_WIDTHS = ["w-2/5", "w-3/5", "w-1/3", "w-1/2", "w-2/3", "w-1/4"];

// note: ukuran baris sama dengan TodoRow (pl-5 untuk drag handle, checkbox 22px, py-1) supaya tidak ada layout shift saat data tiba
export function TodoListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading todos" className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-2 py-1 pl-5">
          <Skeleton className="w-5.5 h-5.5 shrink-0 rounded-[7px]" />
          <Skeleton
            className={`h-4 ${TITLE_WIDTHS[i % TITLE_WIDTHS.length]}`}
          />
        </div>
      ))}
    </div>
  );
}
