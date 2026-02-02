'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Building2, Users, Newspaper, Terminal, LayoutDashboard, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoundToggle } from '@/components/civitas/sound-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cities', href: '/cities', icon: Building2 },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'World News', href: '/news', icon: Newspaper },
];

export function Header() {
  const pathname = usePathname();

  const NavContent = ({ className, onItemClick }: { className?: string, onItemClick?: () => void }) => (
    <nav className={cn("flex flex-col md:flex-row items-stretch md:items-center gap-1", className)}>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'px-4 py-3 md:px-3 md:py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-3 md:gap-2',
              isActive
                ? 'bg-accent text-accent-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-y-[-1px]'
            )}
          >
            <Icon className={cn('w-5 h-5 md:w-4 md:h-4 transition-transform', isActive && 'text-primary')} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 relative transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/logo_icon.png"
                  alt="Zero-One"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-semibold text-lg tracking-tight">Zero-One</span>
            </Link>

            <div className="hidden md:block">
              <NavContent />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SoundToggle />

            <div className="hidden md:flex items-center gap-2">
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
                <span>Agent Console</span>
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] border-l-primary/20 bg-background/95 backdrop-blur-xl">
                  <SheetHeader className="text-left pb-6 border-b border-primary/10">
                    <SheetTitle className="flex items-center gap-2.5 italic uppercase text-primary tracking-tighter">
                      <Terminal className="w-5 h-5" />
                      Zero-One Access
                    </SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <NavContent className="gap-2" onItemClick={() => document.dispatchEvent(new CustomEvent('close-sheet'))} />

                    <div className="pt-6 border-t border-primary/10">
                      <Link
                        href="/console"
                        className={cn(
                          'flex items-center justify-center gap-2 px-4 py-3 text-base font-bold rounded-xl border-2 transition-all duration-300 uppercase italic tracking-wider',
                          pathname.startsWith('/console')
                            ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/40'
                            : 'border-primary/30 text-primary hover:bg-primary/10 hover:border-primary shadow-lg'
                        )}
                      >
                        <Terminal className="w-5 h-5" />
                        Enter Agent Console
                      </Link>
                    </div>

                    <div className="mt-auto pt-10 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-50">
                      // System Online — Phase 1
                      <br />
                      // Authorization Required
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
