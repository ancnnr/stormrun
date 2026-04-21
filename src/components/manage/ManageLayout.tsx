import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/manage/dashboard', label: 'Dashboard' },
  { href: '/manage/missions', label: 'Missions' },
  { href: '/manage/programs', label: 'Programs' },
  { href: '/manage/users', label: 'Users' },
  { href: '/manage/items', label: 'Items' },
  { href: '/manage/items/balance', label: 'Item Balance' },
  { href: '/manage/bulk-grant', label: 'Bulk Grant' },
  { href: '/manage/encouragement', label: 'Encouragement Audio' },
  { href: '/manage/analytics', label: 'Geo Analytics' },
];

export function ManageLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  function logout() {
    sessionStorage.clear();
    router.replace('/manage');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-card px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg tracking-tight mr-4">StormRun Admin</span>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              router.pathname === link.href ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {link.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/manage/docs"
            className={`text-sm transition-colors hover:text-primary ${
              router.pathname === '/manage/docs' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Docs
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
