import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'visitor' | 'user' | 'premium' | 'fisherman' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;

  /** Rôle réel issu de la base */
  userRole: AppRole | null;

  /** Pour les admins : rôle simulé (UX uniquement, ne change pas les droits backend) */
  viewAsRole: AppRole | null;

  /** Rôle effectif à utiliser côté UI/routing */
  effectiveRole: AppRole | null;

  isAdmin: boolean;
  isVerifiedFisherman: boolean;

  setViewAsRole: (role: AppRole | null) => void;
  clearViewAsRole: () => void;

  signIn: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseRole = (value: string | null): AppRole | null => {
  if (!value) return null;
  const allowed: AppRole[] = ['visitor', 'user', 'premium', 'fisherman', 'admin'];
  return allowed.includes(value as AppRole) ? (value as AppRole) : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isVerifiedFisherman, setIsVerifiedFisherman] = useState(false);

  const [viewAsRole, setViewAsRoleState] = useState<AppRole | null>(() => {
    try {
      return parseRole(sessionStorage.getItem('qd_view_as_role'));
    } catch {
      return null;
    }
  });

  const { toast } = useToast();

  const isAdmin = userRole === 'admin';
  const effectiveRole = useMemo<AppRole | null>(() => {
    if (userRole !== 'admin') return userRole;
    return viewAsRole ?? userRole;
  }, [userRole, viewAsRole]);

  const setViewAsRole = (role: AppRole | null) => {
    if (!isAdmin) return;

    const next = role === 'admin' ? null : role;
    setViewAsRoleState(next);

    try {
      if (next) sessionStorage.setItem('qd_view_as_role', next);
      else sessionStorage.removeItem('qd_view_as_role');
    } catch {
      // ignore storage errors
    }
  };

  const clearViewAsRole = () => setViewAsRole(null);

  // Empêche l'utilisation du mode test si on n'est pas admin
  useEffect(() => {
    if (userRole && userRole !== 'admin' && viewAsRole) {
      setViewAsRoleState(null);
      try {
        sessionStorage.removeItem('qd_view_as_role');
      } catch {
        // ignore
      }
    }
  }, [userRole, viewAsRole]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user role
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setIsVerifiedFisherman(false);
          setViewAsRoleState(null);
          try {
            sessionStorage.removeItem('qd_view_as_role');
          } catch {
            // ignore
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Fetch all roles for the user
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error fetching roles:', roleError);
        return;
      }

      // Priority order: admin > fisherman > premium > user
      const roles = (rolesData?.map(r => r.role) || []) as AppRole[];
      let primaryRole: AppRole | null = null;

      if (roles.includes('admin')) {
        primaryRole = 'admin';
      } else if (roles.includes('fisherman')) {
        primaryRole = 'fisherman';
      } else if (roles.includes('premium')) {
        primaryRole = 'premium';
      } else if (roles.includes('user')) {
        primaryRole = 'user';
      }

      setUserRole(primaryRole);

      // Check if fisherman has completed onboarding (no admin verification required)
      if (roles.includes('fisherman')) {
        const { data: fishermanData, error: fishermanError } = await supabase
          .from('fishermen')
          .select('boat_name, siret')
          .eq('user_id', userId)
          .maybeSingle() as { data: { boat_name: string | null; siret: string | null } | null; error: any };

        if (fishermanError) {
          console.error('Error fetching fisherman:', fishermanError);
          return;
        }

        // Fisherman is "verified" if onboarding is complete (no admin verification needed)
        const isOnboardingComplete = fishermanData &&
          fishermanData.boat_name &&
          fishermanData.boat_name !== 'À compléter' &&
          fishermanData.siret &&
          fishermanData.siret !== 'À compléter';

        setIsVerifiedFisherman(!!isOnboardingComplete);
      } else {
        setIsVerifiedFisherman(false);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Code envoyé',
        description: 'Vérifiez votre boîte e-mail pour le code de connexion.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté.',
      });
    } catch (error: any) {
      // Traduire les erreurs Supabase courantes en français
      let errorMessage = error.message;
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Trop de tentatives. Réessayez dans quelques minutes.';
      }
      
      toast({
        title: 'Erreur de connexion',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;

      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté.',
      });
    } catch (error: any) {
      toast({
        title: 'Code invalide',
        description: 'Le code saisi est incorrect ou expiré.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Force local logout - always clears localStorage even if session doesn't exist on server
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore errors - we'll clean up locally anyway
    }

    // Always reset local state, regardless of API response
    setSession(null);
    setUser(null);
    setUserRole(null);
    setIsVerifiedFisherman(false);
    setViewAsRoleState(null);
    try {
      sessionStorage.removeItem('qd_view_as_role');
    } catch {
      // ignore
    }

    toast({
      title: 'Déconnexion',
      description: 'À bientôt !',
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole,
      viewAsRole,
      effectiveRole,
      isAdmin,
      isVerifiedFisherman,
      setViewAsRole,
      clearViewAsRole,
      signIn,
      signInWithPassword,
      signInWithGoogle,
      verifyOtp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

