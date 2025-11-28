import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isVerifiedFisherman: boolean;
  signIn: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isVerifiedFisherman, setIsVerifiedFisherman] = useState(false);
  const { toast } = useToast();

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
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRole(session.user.id); // Wait for role to be fetched
      }
      setLoading(false); // Only set loading to false after role is fetched
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
      const roles = rolesData?.map(r => r.role) || [];
      let primaryRole = null;
      
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

      // Check if verified fisherman
      if (roles.includes('fisherman')) {
        const { data: fishermanData, error: fishermanError } = await supabase
          .from('fishermen')
          .select('verified_at')
          .eq('user_id', userId)
          .maybeSingle() as { data: { verified_at: string | null } | null; error: any };
        
        if (fishermanError) {
          console.error('Error fetching fisherman:', fishermanError);
          return;
        }

        setIsVerifiedFisherman(fishermanData ? !!fishermanData.verified_at : false);
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
    } catch (error) {
      // Ignore errors - we'll clean up locally anyway
      console.log('Logout error (ignored):', error);
    }
    
    // Always reset local state, regardless of API response
    setSession(null);
    setUser(null);
    setUserRole(null);
    setIsVerifiedFisherman(false);
    
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
      isVerifiedFisherman,
      signIn,
      signInWithPassword,
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
