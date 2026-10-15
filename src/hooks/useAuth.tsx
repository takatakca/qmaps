import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AuthError, User, Session } from "@supabase/supabase-js";

type AppRole = "user" | "merchant" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isMerchant: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const NO_ROLES: AppRole[] = [];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // A role applies only to the exact account for which it was loaded.
  const [roleState, setRoleState] = useState<{ ownerId: string | null; roles: AppRole[] }>({
    ownerId: null, roles: NO_ROLES,
  });
  const activeOwnerId = useRef<string | null>(null);
  const roleRequestVersion = useRef(0);

  const fetchRoles = async (userId: string): Promise<void> => {
    const version = ++roleRequestVersion.current;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (activeOwnerId.current !== userId || roleRequestVersion.current !== version) return;
    if (error) {
      setRoleState({ ownerId: null, roles: NO_ROLES });
      throw error;
    }
    setRoleState({ ownerId: userId, roles: (data ?? []).map((row) => row.role as AppRole) });
  };

  const refreshRoles = async () => {
    if (activeOwnerId.current) await fetchRoles(activeOwnerId.current);
  };

  useEffect(() => {
    let disposed = false;
    let receivedAuthEvent = false;
    const applySession = (next: Session | null) => {
      if (disposed) return;
      const nextUserId = next?.user.id ?? null;
      if (activeOwnerId.current !== nextUserId) {
        activeOwnerId.current = nextUserId;
        roleRequestVersion.current += 1;
        setRoleState({ ownerId: null, roles: NO_ROLES });
      }
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
      if (nextUserId) {
        // Supabase API calls must not be awaited inside onAuthStateChange.
        setTimeout(() => {
          if (!disposed && activeOwnerId.current === nextUserId) {
            void fetchRoles(nextUserId).catch(() => {
              // Deny privileges until a later successful role refresh.
            });
          }
        }, 0);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      receivedAuthEvent = true;
      applySession(next);
    });
    void supabase.auth.getSession()
      .then(({ data: { session: initial } }) => {
        // A stale bootstrap session must not restore a logged-out account.
        if (!receivedAuthEvent) applySession(initial);
      })
      .catch(() => {
        if (!receivedAuthEvent) applySession(null);
      });

    return () => {
      disposed = true;
      roleRequestVersion.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    // Prevent a pending role lookup from restoring privilege after sign-out.
    activeOwnerId.current = null;
    roleRequestVersion.current += 1;
    setRoleState({ ownerId: null, roles: NO_ROLES });
    await supabase.auth.signOut();
  };

  const roles = user && roleState.ownerId === user.id ? roleState.roles : NO_ROLES;
  const isMerchant = roles.includes("merchant") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, isMerchant, isAdmin, signUp, signIn, signOut, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
