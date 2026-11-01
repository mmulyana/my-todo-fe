import { createContext, useContext } from "react";

export const ReorderContext = createContext(false);

export const useReordering = () => useContext(ReorderContext);
