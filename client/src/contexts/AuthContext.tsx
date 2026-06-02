import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  nombre: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Decodifica el payload del JWT sin verificar firma (solo para leer los datos)
function decodeJwtPayload(token: string): { userId: number; exp: number } | null {
  try {
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  // Expirado si ya pasó la fecha (con 60 segundos de margen)
  return payload.exp * 1000 < Date.now() + 60_000;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const savedToken = localStorage.getItem('obratrack_token');
  const savedUser: User | null = (() => {
    try { return JSON.parse(localStorage.getItem('obratrack_user') || 'null'); }
    catch { return null; }
  })();

  const [user, setUser] = useState<User | null>(savedUser);
  const [token, setToken] = useState<string | null>(savedToken);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Si el token ya expiró, hacer logout limpio
    if (isTokenExpired(token)) {
      logout();
      return;
    }

    // Sincronizar el header de axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Si ya tenemos el usuario en memoria (venía de localStorage), no mostramos carga
    if (savedUser) setIsLoading(false);

    // Verificar con el servidor en segundo plano
    axios.get('/api/auth/me')
      .then(res => {
        const freshUser = res.data.user;
        setUser(freshUser);
        localStorage.setItem('obratrack_user', JSON.stringify(freshUser));
      })
      .catch(err => {
        // Solo hacer logout si el servidor devuelve 401 (token inválido/expirado)
        // Si es un error de red, mantenemos la sesión local
        if (err.response?.status === 401) {
          logout();
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('obratrack_token', newToken);
    localStorage.setItem('obratrack_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    toast.success(`Bienvenido, ${newUser.nombre}`);
  };

  const logout = () => {
    localStorage.removeItem('obratrack_token');
    localStorage.removeItem('obratrack_user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}
