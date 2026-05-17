'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setToken(session.access_token);
        
        // Fetch user and tenant data
        const { data: userData } = await supabase
          .from('User')
          .select('*, tenant:Tenant(*)')
          .eq('email', session.user.email)
          .single();

        if (userData) {
          setUser(userData);
          setTenant(userData.tenant);
          axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
          if (userData.tenant) {
            axios.defaults.headers.common['x-tenant-id'] = userData.tenant.id;
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setTenant(null);
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['x-tenant-id'];
        router.push('/login');
      } else if (session && !user) {
        // Handle login event if needed
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: any) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (authError) throw authError;

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('*, tenant:Tenant(*)')
      .eq('email', credentials.email)
      .single();
    
    if (userError) throw userError;

    setUser(userData);
    setTenant(userData.tenant);
    setToken(authData.session?.access_token || null);
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${authData.session?.access_token}`;
    if (userData.tenant) {
      axios.defaults.headers.common['x-tenant-id'] = userData.tenant.id;
    }
    
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    // Basic implementation for now
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    
    if (authError) throw authError;
    
    // We would normally create the tenant and user in the database here,
    // but for now we just throw an error as it requires backend logic or Edge Functions
    throw new Error("O registro de novos tenants deve ser implementado no backend.");
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, tenant, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
