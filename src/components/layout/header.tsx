import { LoginButton } from '@/components/auth/login-button';
import { ModeToggle } from '@/components/ui/mode-toggle';

export function Header() {
  return (
    <div className="flex items-center justify-between text-foreground bg-white dark:bg-black p-2">
      <div className="flex-1"></div>
      <p className="absolute left-1/2 transform -translate-x-1/2 font-mono text-sm">
        Auth0による認証・認可の実験
      </p>
      <div className="flex items-center space-x-4">
        <LoginButton />
        <ModeToggle />
      </div>
    </div>
  );
}