import { useContext, useSyncExternalStore } from "react";
import { UNSAFE_DataRouterContext } from "react-router-dom";

// note: useSearchParams me-render ulang di setiap perubahan query string, hook ini hanya saat param yang dibaca berubah
export function useSearchParam(name: string): string | null {
  const router = useContext(UNSAFE_DataRouterContext)!.router;

  return useSyncExternalStore(
    (onChange) => router.subscribe(onChange),
    () => new URLSearchParams(router.state.location.search).get(name),
  );
}
