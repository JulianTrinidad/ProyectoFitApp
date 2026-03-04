import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Dumbbell, Eye, EyeOff, Flame, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function LoginScreen() {
  const { login, setViewMode, setCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados del modal de registro
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [regError, setRegError] = useState('');

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

  const clearRegisterForm = () => {
    setRegName('');
    setRegLastName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    // Validaciones
    if (regPassword.length < 6) {
      setRegError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden.');
      return;
    }

    setRegIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
      });

      if (signUpError) {
        setRegError('Error al crear la cuenta: ' + signUpError.message);
        setRegIsLoading(false);
        return;
      }

      const user = data.user;

      if (!user) {
        setRegError('No se pudo obtener la información del usuario.');
        setRegIsLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          email: regEmail,
          name: regName + ' ' + regLastName,
          role: 'client',
          avatar: '',
          membership_status: 'active',
        },
      ]);

      if (profileError) {
        setRegError('Error al crear el perfil: ' + profileError.message);
        setRegIsLoading(false);
        return;
      }

      // Éxito: cerrar modal y limpiar formulario
      setShowRegister(false);
      clearRegisterForm();
    } catch (err) {
      setRegError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setRegIsLoading(false);
    }
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
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => setShowRegister(true)}
            className="text-primary font-medium hover:underline"
          >
            Regístrate aquí
          </button>
        </p>
      </div>

      {/* Modal de Registro */}
      <Dialog open={showRegister} onOpenChange={(open) => {
        setShowRegister(open);
        if (!open) clearRegisterForm();
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Crear Cuenta</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="regName">Nombre</Label>
                <Input
                  id="regName"
                  type="text"
                  placeholder="Juan"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regLastName">Apellido</Label>
                <Input
                  id="regLastName"
                  type="text"
                  placeholder="Pérez"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regEmail">Correo Electrónico</Label>
              <Input
                id="regEmail"
                type="email"
                placeholder="tu@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regPassword">Contraseña</Label>
              <Input
                id="regPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regConfirmPassword">Confirmar Contraseña</Label>
              <Input
                id="regConfirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            {regError && (
              <p className="text-destructive text-sm animate-fade-in">{regError}</p>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full"
              disabled={regIsLoading}
            >
              {regIsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
