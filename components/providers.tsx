"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { SessionUser } from "@/types/database";

interface AppContextValue {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  isKidMode: boolean;
  toggleKidMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [isKidMode, setIsKidMode] = useState(initialUser?.role === "kid");

  const toggleKidMode = useCallback(() => {
    setIsKidMode((prev) => !prev);
  }, []);

  return (
    <AppContext.Provider value={{ user, setUser, isKidMode, toggleKidMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
