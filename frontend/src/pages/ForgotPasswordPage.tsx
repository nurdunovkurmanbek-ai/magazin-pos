import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useAuthStore } from '@/store/auth.store';

/**
 * Сырсөздү унутуу баракчасы
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword, isLoading, error, message, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      const token = await forgotPassword(email);
      setSent(true);
      if (token) setDevToken(token);
    } catch {
      // error in store
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <Card className="relative w-full max-w-md shadow-xl border-border/50 animate-scale-in">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Store className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t('auth.forgotPasswordTitle')}</CardTitle>
            <CardDescription className="mt-1.5">{t('auth.forgotPasswordSubtitle')}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="rounded-md bg-success/10 border border-success/20 px-4 py-3">
                <p className="text-sm text-success font-medium">{t('auth.forgotPasswordSent')}</p>
              </div>

              {devToken && (
                <div className="rounded-md bg-muted p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-2">{t('auth.devResetToken')}</p>
                  <code className="text-xs break-all">{devToken}</code>
                  <Link to={`/reset-password?token=${devToken}`}>
                    <Button size="touch" variant="outline" className="w-full mt-3">
                      {t('auth.goToReset')}
                    </Button>
                  </Link>
                </div>
              )}

              <Link to="/login">
                <Button variant="ghost" size="touch" className="w-full">
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  touch
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@magazin.kg"
                  required
                  autoComplete="email"
                />
              </div>

              {(error || message) && error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive text-center">{t(`auth.${error}`)}</p>
                </div>
              )}

              <Button type="submit" size="touch" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.sendResetLink')
                )}
              </Button>

              <Link to="/login" className="block">
                <Button variant="ghost" size="touch" className="w-full" type="button">
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
