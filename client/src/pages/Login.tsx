import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { HardHat } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const res = await axios.post('/api/auth/register', { email, password, nombre });
        login(res.data.token, res.data.user);
        setLocation('/app');
      } else {
        const res = await axios.post('/api/auth/login', { email, password });
        login(res.data.token, res.data.user);
        setLocation('/app');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-8 relative overflow-hidden">
        {/* Decorative subtle background */}
        <div className="absolute top-0 right-0 -z-10 opacity-10 transform translate-x-1/2 -translate-y-1/2 blur-[60px] w-64 h-64 bg-primary rounded-full"></div>

        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <HardHat className="w-8 h-8 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight">ObraTrack</span>
            </div>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold">
            {isRegister ? 'Crea tu cuenta' : 'Inicia Sesión'}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm text-center">
            {isRegister 
              ? 'Únete a la plataforma de construcción líder.' 
              : 'Bienvenido de vuelta. Conecta campo y oficina.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <input 
                type="text" 
                required 
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ingeniero Pérez"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Correo electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="tu@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? 'Cargando...' : (isRegister ? 'Registrarse' : 'Ingresar')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
          </span>
          {' '}
          <button 
            type="button" 
            onClick={() => setIsRegister(!isRegister)}
            className="text-primary font-medium hover:underline focus:outline-none"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
