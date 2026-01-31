'use client';

import { ReactNode, useState } from 'react';
import { UniversalHeader } from './UniversalHeader';
import { MinimalSidebar } from './MinimalSidebar';
import { MobileNav } from './MobileNav';
import { UserMenu } from './UserMenu';
import { CommandPalette, useCommandPalette } from '@/components/search/CommandPalette';

interface AppLayoutProps {
  children: ReactNode;
  showWallet?: boolean;
  showSearch?: boolean;
}

export function AppLayout({ children, showWallet = true, showSearch = true }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const commandPalette = useCommandPalette();

  // Note: User ensuring is handled by PrivyWalletProvider's UserEnsurerWithPrivy

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Minimal Sidebar */}
      <MinimalSidebar />
      
      {/* Main Content Area */}
      <div className="sm:pl-16 md:pl-20">
        {/* Universal Header */}
        <UniversalHeader
          onMenuClick={() => setMenuOpen(!menuOpen)}
          showWallet={showWallet}
          showSearch={showSearch}
          onSearchClick={commandPalette.open}
        />
        
        {/* Main Content */}
        <main className="w-full py-4 sm:py-6 px-3 sm:px-4 md:px-6">
          {children}
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* User Menu */}
      <UserMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
    </div>
  );
}
