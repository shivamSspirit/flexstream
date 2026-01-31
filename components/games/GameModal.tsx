'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { GameData } from '@/components/explore/GamesTab';
import { CoinFlipGame } from './CoinFlipGame';
import { PredictionGame } from './PredictionGame';
import { SpinWheelGame } from './SpinWheelGame';

interface GameModalProps {
  game: GameData;
  isOpen: boolean;
  onClose: () => void;
}

const GAME_COMPONENTS: Record<string, React.FC<{ onClose: () => void }>> = {
  'coin-flip': CoinFlipGame,
  'price-prediction': PredictionGame,
  'spin-wheel': SpinWheelGame,
};

// Placeholder for games not yet implemented
function ComingSoonGame({ onClose, game }: { onClose: () => void; game: GameData }) {
  return (
    <div className={cn(
      'w-full h-full flex flex-col items-center justify-center p-8',
      game.theme === 'gold' && 'bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950',
      game.theme === 'cyan' && 'bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950',
      game.theme === 'rainbow' && 'bg-gradient-to-br from-violet-950 via-purple-950 to-fuchsia-950',
      game.theme === 'magenta' && 'bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950',
      game.theme === 'emerald' && 'bg-gradient-to-br from-slate-950 via-emerald-950 to-green-950',
    )}>
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">{game.icon}</div>
        <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          {game.name}
        </h2>
        <p className="text-white/60 mb-8">{game.description}</p>

        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 mb-8">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </div>
          <span className="text-amber-300 font-bold">Coming Soon</span>
        </div>

        <button
          onClick={onClose}
          className="px-8 py-4 rounded-2xl font-bold text-lg bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          Back to Games
        </button>
      </div>
    </div>
  );
}

export function GameModal({ game, isOpen, onClose }: GameModalProps) {
  const GameComponent = GAME_COMPONENTS[game.id];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl" />
        </Transition.Child>

        {/* Content */}
        <div className="fixed inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full h-full">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              {/* Demo Mode Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                <div className="px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/30">
                  <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">Demo Mode - Devnet Only</span>
                </div>
              </div>

              {/* Game Content */}
              <div className="w-full h-full pt-16">
                {GameComponent ? (
                  <GameComponent onClose={onClose} />
                ) : (
                  <ComingSoonGame onClose={onClose} game={game} />
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
