import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell, Eye, EyeOff, Flame } from 'lucide-react';

export function LoginScreen() {
  const { login, setViewMode, setCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(email, password);
    if (!success) {
      setError('Credenciales inválidas. Prueba con: maria@gmail.com o carlos@fitpro.com');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = (type: 'trainer' | 'client') => {
    if (type === 'trainer') {
      setEmail('carlos@fitpro.com');
    } else {
      setEmail('maria@gmail.com');
    }
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 glow-primary">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FitPro</h1>
          <p className="text-muted-foreground mt-2">Tu plataforma de fitness integral</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm animate-fade-in">{error}</p>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-4">Acceso rápido demo</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => handleQuickLogin('client')}
                className="h-12"
              >
                👤 Usuario
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleQuickLogin('trainer')}
                className="h-12"
              >
                🏋️ Entrenador
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <button className="text-primary font-medium hover:underline">
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}
