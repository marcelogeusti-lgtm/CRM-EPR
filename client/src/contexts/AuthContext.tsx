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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder-project');
      
      let session = null;
      if (!isPlaceholderSupabase) {
        try {
          const sessionResult = await supabase.auth.getSession();
          session = sessionResult.data.session;
        } catch (err) {
          console.warn("Supabase auth session fetch failed, falling back to local auth...", err);
        }
      }

      if (session) {
        setToken(session.access_token);
        
        try {
          // Fetch user and tenant data from Supabase DB
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
              localStorage.setItem('tenantId', userData.tenant.id);
            }
            localStorage.setItem('token', session.access_token);
          }
        } catch (err) {
          console.warn("Falha ao buscar perfil no Supabase, tentando fallback local...", err);
        }
      } else {
        // Fallback local: busca token JWT e tenantId gravados no localStorage
        const storedToken = localStorage.getItem('token');
        const storedTenantId = localStorage.getItem('tenantId');
        
        if (storedToken) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            if (storedTenantId) {
              axios.defaults.headers.common['x-tenant-id'] = storedTenantId;
            }

            const response = await axios.get(`${apiUrl}/auth/me`);
            const { user: backendUser, tenant: backendTenant } = response.data;
            
            setUser(backendUser);
            setTenant(backendTenant);
            setToken(storedToken);
          } catch (err) {
            console.error("Falha ao reautenticar token local:", err);
            // Se o token local estiver inválido ou expirado, limpa-o
            localStorage.removeItem('token');
            localStorage.removeItem('tenantId');
            delete axios.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['x-tenant-id'];
            setUser(null);
            setTenant(null);
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Configurar listener do Supabase apenas se a URL não for placeholder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder-project');
    
    let subscription: any = null;

    if (!isPlaceholderSupabase) {
      try {
        const authChange = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setTenant(null);
            setToken(null);
            delete axios.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['x-tenant-id'];
            localStorage.removeItem('token');
            localStorage.removeItem('tenantId');
            router.push('/login');
          }
        });
        subscription = authChange.data.subscription;
      } catch (err) {
        console.warn("Falha ao configurar listener do Supabase:", err);
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (credentials: any) => {
    // --- BYPASS PARA DEMONSTRAÇÃO VISUAL (SEM BACKEND) ---
    if (credentials.email === 'admin@demo.com' && credentials.password === 'admin123') {
      const mockUser = { id: 'mock-123', email: 'admin@demo.com', name: 'Administrador Demo', role: 'ADMIN' };
      const mockTenant = { id: 'tenant-123', name: 'Demo Corp', slug: 'demo-corp' };
      
      setUser(mockUser);
      setTenant(mockTenant);
      setToken('mock-jwt-token');
      
      axios.defaults.headers.common['Authorization'] = `Bearer mock-jwt-token`;
      axios.defaults.headers.common['x-tenant-id'] = 'tenant-123';
      localStorage.setItem('tenantId', 'tenant-123');
      localStorage.setItem('token', 'mock-jwt-token');
      
      router.push('/dashboard');
      return;
    }
    // ------------------------------------------------------

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder-project');

    if (!isPlaceholderSupabase) {
      try {
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
          localStorage.setItem('tenantId', userData.tenant.id);
        }
        localStorage.setItem('token', authData.session?.access_token || '');
        
        router.push('/dashboard');
        return;
      } catch (err) {
        console.warn("Falha no login via Supabase, tentando login direto no backend...", err);
      }
    }

    // Fallback local: comunicação direta com a API NestJS
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await axios.post(`${apiUrl}/auth/login`, credentials);
    const { user: backendUser, token: backendToken, tenant: backendTenant } = response.data;

    setUser(backendUser);
    setTenant(backendTenant);
    setToken(backendToken);

    axios.defaults.headers.common['Authorization'] = `Bearer ${backendToken}`;
    if (backendTenant) {
      axios.defaults.headers.common['x-tenant-id'] = backendTenant.id;
      localStorage.setItem('tenantId', backendTenant.id);
    }
    localStorage.setItem('token', backendToken);
    
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder-project');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    if (!isPlaceholderSupabase) {
      try {
        // 1. Cadastrar no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
            }
          }
        });
        
        if (authError) throw authError;

        if (authData?.user) {
          // 2. Chamar endpoint do backend passando o ID gerado pelo Supabase para replicar o Tenant e o Administrador
          const response = await axios.post(`${apiUrl}/auth/register`, {
            id: authData.user.id, // Sincroniza o UUID do Supabase
            companyName: data.companyName,
            name: data.name,
            email: data.email,
            password: data.password,
          });

          const { user: backendUser, token: backendToken, tenant: backendTenant } = response.data;
          
          setUser(backendUser);
          setTenant(backendTenant);
          setToken(authData.session?.access_token || backendToken);

          axios.defaults.headers.common['Authorization'] = `Bearer ${authData.session?.access_token || backendToken}`;
          if (backendTenant) {
            axios.defaults.headers.common['x-tenant-id'] = backendTenant.id;
            localStorage.setItem('tenantId', backendTenant.id);
          }
          localStorage.setItem('token', authData.session?.access_token || backendToken);
          
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        console.warn("Falha no registro via Supabase, tentando registro direto no backend...", err);
      }
    }

    // Fallback local: cadastro direto no backend
    const response = await axios.post(`${apiUrl}/auth/register`, {
      companyName: data.companyName,
      name: data.name,
      email: data.email,
      password: data.password,
    });

    const { user: backendUser, token: backendToken, tenant: backendTenant } = response.data;

    setUser(backendUser);
    setTenant(backendTenant);
    setToken(backendToken);

    axios.defaults.headers.common['Authorization'] = `Bearer ${backendToken}`;
    if (backendTenant) {
      axios.defaults.headers.common['x-tenant-id'] = backendTenant.id;
      localStorage.setItem('tenantId', backendTenant.id);
    }
    localStorage.setItem('token', backendToken);
    
    router.push('/dashboard');
  };

  const logout = async () => {
    setUser(null);
    setTenant(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['x-tenant-id'];
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('placeholder-project');
      if (!isPlaceholderSupabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("Erro ao deslogar no Supabase:", err);
    }
    
    router.push('/login');
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
