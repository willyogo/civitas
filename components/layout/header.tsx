'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Building2, Users, Newspaper, Terminal, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoundToggle } from '@/components/civitas/sound-toggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 relative transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/logo_icon.png"
                  alt="Civitas"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-semibold text-lg tracking-tight">Civitas</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-y-[-1px]'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 transition-transform', isActive && 'text-primary')} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <Link
              href="/console"
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-all duration-200',
                pathname.startsWith('/console')
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                  : 'border-border hover:bg-accent hover:text-accent-foreground hover:border-primary/30 hover:shadow-md'
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
