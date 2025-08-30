'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Heart, Film, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { selectFavoriteIds } from '@/store/slices/favorites';
import type { RootState } from '@/store';

const navigationItems = [
  {
    name: 'Favorites',
    href: '/favorites',
    icon: Heart,
  },
  {
    name: 'Sign Up',
    href: '/signup',
    icon: UserPlus,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const favoriteCount = useSelector((state: RootState) => selectFavoriteIds(state).length);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-xl hover:scale-105 transition-all duration-200"
          >
            <Film className="h-6 w-6 animate-pulse" />
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Movies Collection
            </span>
          </Link>

          {/* Navigation Links & Theme Toggle */}
          <div className="flex items-center gap-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'default' : 'ghost'}
                  asChild
                  className="relative hover:scale-105 transition-all duration-200"
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                    {item.name === 'Favorites' && favoriteCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 h-5 min-w-[20px] px-1 text-xs animate-pulse"
                      >
                        {favoriteCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              );
            })}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}