'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, Newspaper, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Building2 },
  { name: 'Cities', href: '/cities', icon: Building2 },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'World News', href: '/news', icon: Newspaper },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">Civitas</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/console"
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-colors',
                pathname.startsWith('/console')
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">Agent Console</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
