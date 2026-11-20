"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api-client";
import type { Me } from "./types";

interface SessionValue {
  user: Me | null;
  loading: boolean;
  can: (capability: string) => boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: true,
  can: () => false,
  refresh: async () => undefined,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.me();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const can = useCallback(
    (capability: string) => user?.capabilities?.includes(capability) ?? false,
    [user],
  );

  return (
    <SessionContext.Provider value={{ user, loading, can, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}
