'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { useSearch, SearchUser, SearchPost, SearchToken } from '@/hooks/useSearch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  MagnifyingGlassIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { query, setQuery, results, isLoading, hasResults, clearSearch } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Combine all results for keyboard navigation
  const allResults = [
    ...results.users.map(u => ({ ...u, _type: 'user' as const })),
    ...results.tokens.map(t => ({ ...t, _type: 'token' as const })),
    ...results.posts.map(p => ({ ...p, _type: 'post' as const })),
  ];

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [isOpen, allResults, selectedIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle selection
  const handleSelect = (item: any) => {
    switch (item._type) {
      case 'user':
        router.push(`/profile/${item.walletAddress}`);
        break;
      case 'token':
        router.push(`/post/${item.id}`);
        break;
      case 'post':
        router.push(`/post/${item.id}`);
        break;
    }
    clearSearch();
    onClose();
  };

  // Handle close
  const handleClose = () => {
    clearSearch();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-card-bg border border-white/10 shadow-2xl shadow-black/50 transition-all">
                {/* Search Input */}
                <div className="relative flex items-center border-b border-white/10">
                  <MagnifyingGlassIcon className="absolute left-4 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search creators, tokens, posts..."
                    className="w-full pl-12 pr-12 py-4 bg-transparent text-white placeholder:text-text-muted focus:outline-none text-lg"
                    autoFocus
                  />
                  {query && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-text-muted" />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading && query.length >= 2 && (
                    <div className="p-8 text-center">
                      <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  )}

                  {!isLoading && query.length >= 2 && !hasResults && (
                    <div className="p-8 text-center">
                      <p className="text-text-muted">No results found for "{query}"</p>
                    </div>
                  )}

                  {!isLoading && hasResults && (
                    <div className="py-2">
                      {/* Users Section */}
                      {results.users.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                            Creators
                          </div>
                          {results.users.map((user, index) => (
                            <button
                              key={user.id}
                              onClick={() => handleSelect({ ...user, _type: 'user' })}
                              className={cn(
                                'w-full px-4 py-3 flex items-center gap-3 transition-colors',
                                selectedIndex === index
                                  ? 'bg-accent-purple/20'
                                  : 'hover:bg-white/5'
                              )}
                            >
                              <Avatar className="w-10 h-10 shrink-0">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white">
                                  {user.displayName?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-medium text-white truncate">{user.displayName}</p>
                                <p className="text-sm text-text-muted truncate">@{user.username}</p>
                              </div>
                              <ArrowRightIcon className="w-4 h-4 text-text-muted shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tokens Section */}
                      {results.tokens.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                            Tokens
                          </div>
                          {results.tokens.map((token, index) => {
                            const actualIndex = results.users.length + index;
                            return (
                              <button
                                key={token.id}
                                onClick={() => handleSelect({ ...token, _type: 'token' })}
                                className={cn(
                                  'w-full px-4 py-3 flex items-center gap-3 transition-colors',
                                  selectedIndex === actualIndex
                                    ? 'bg-accent-purple/20'
                                    : 'hover:bg-white/5'
                                )}
                              >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center shrink-0">
                                  <CurrencyDollarIcon className="w-5 h-5 text-black" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <p className="font-medium text-white truncate">${token.symbol}</p>
                                  <p className="text-sm text-text-muted truncate">{token.displayName}</p>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 text-text-muted shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Posts Section */}
                      {results.posts.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                            Posts
                          </div>
                          {results.posts.map((post, index) => {
                            const actualIndex = results.users.length + results.tokens.length + index;
                            return (
                              <button
                                key={post.id}
                                onClick={() => handleSelect({ ...post, _type: 'post' })}
                                className={cn(
                                  'w-full px-4 py-3 flex items-center gap-3 transition-colors',
                                  selectedIndex === actualIndex
                                    ? 'bg-accent-purple/20'
                                    : 'hover:bg-white/5'
                                )}
                              >
                                {post.mediaUrl ? (
                                  <img
                                    src={post.mediaUrl}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                    <DocumentTextIcon className="w-5 h-5 text-text-muted" />
                                  </div>
                                )}
                                <div className="flex-1 text-left min-w-0">
                                  <p className="font-medium text-white truncate">{post.title}</p>
                                  <p className="text-sm text-text-muted truncate">
                                    by @{post.user?.username}
                                  </p>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 text-text-muted shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Links when empty */}
                  {query.length < 2 && (
                    <div className="py-4">
                      <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                        Quick Links
                      </div>
                      {[
                        { label: 'Explore Tokens', href: '/explore?tab=tokens', icon: CurrencyDollarIcon },
                        { label: 'Top Creators', href: '/explore?tab=creators', icon: UserIcon },
                        { label: 'Leaderboard', href: '/explore?tab=leaderboard', icon: DocumentTextIcon },
                      ].map((link, index) => (
                        <button
                          key={link.href}
                          onClick={() => {
                            router.push(link.href);
                            onClose();
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <link.icon className="w-5 h-5 text-text-muted" />
                          </div>
                          <span className="text-white">{link.label}</span>
                          <ArrowRightIcon className="w-4 h-4 text-text-muted ml-auto shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↵</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">esc</kbd>
                      close
                    </span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Hook to control command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
