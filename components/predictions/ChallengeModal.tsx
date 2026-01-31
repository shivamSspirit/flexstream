'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ChallengeModal - Stake against a friend on a prediction
 *
 * Design: "The Call-Out" mechanic
 * - Dramatic VS reveal animation
 * - Obsidian vault aesthetic
 * - Mint Frost accent for CTAs
 * - Stakes visualization
 */

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  flexScore: number;
  winRate: number;
}

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: {
    ticker: string;
    title: string;
    yesPrice: number;
    noPrice: number;
  };
  friends: Friend[];
  onChallenge: (friendId: string, stake: number, yourSide: 'yes' | 'no') => void;
}

const STAKE_OPTIONS = [5, 10, 25, 50, 100];

export function ChallengeModal({
  isOpen,
  onClose,
  market,
  friends,
  onChallenge,
}: ChallengeModalProps) {
  const [step, setStep] = useState<'select-friend' | 'select-side' | 'select-stake' | 'confirm'>('select-friend');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [yourSide, setYourSide] = useState<'yes' | 'no'>('yes');
  const [stake, setStake] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select-friend');
        setSelectedFriend(null);
        setYourSide('yes');
        setStake(10);
        setSearchQuery('');
      }, 300);
    }
  }, [isOpen]);

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedFriend) {
      onChallenge(selectedFriend.id, stake, yourSide);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className={cn(
              "relative overflow-hidden",
              "bg-[#0A0A0A] border border-white/[0.08] rounded-[16px]",
              // Noise texture
              "before:absolute before:inset-0 before:opacity-[0.02]",
              "before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]",
              "before:pointer-events-none"
            )}>
              {/* Header glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E0FF62]/30 to-transparent" />

              {/* Header */}
              <div className="relative z-10 p-5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E0FF62]/10 border border-[#E0FF62]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#E0FF62]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-serif text-white" style={{ fontFamily: "'Cormorant Garabond', serif" }}>
                        Challenge
                      </h2>
                      <p className="text-xs font-mono text-white/40">Stake against a friend</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Market info */}
                <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-sm text-white/70 line-clamp-2">{market.title}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-mono text-[#FFD700]">YES {market.yesPrice}¢</span>
                    <span className="text-xs font-mono text-white/20">|</span>
                    <span className="text-xs font-mono text-[#C0C0C0]">NO {market.noPrice}¢</span>
                  </div>
                </div>
              </div>

              {/* Content - Steps */}
              <div className="relative z-10 p-5 max-h-[60vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Step 1: Select Friend */}
                  {step === 'select-friend' && (
                    <motion.div
                      key="select-friend"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3 block">
                        Who do you want to challenge?
                      </label>

                      {/* Search */}
                      <div className="relative mb-4">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search friends..."
                          className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#E0FF62]/30 transition-colors font-mono"
                        />
                      </div>

                      {/* Friends list */}
                      <div className="space-y-2">
                        {filteredFriends.map((friend) => (
                          <motion.button
                            key={friend.id}
                            onClick={() => {
                              setSelectedFriend(friend);
                              setStep('select-side');
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-[#E0FF62]/20 hover:bg-white/[0.04] transition-all flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-white/[0.08] flex items-center justify-center">
                              <span className="text-sm font-bold text-white/60">
                                {friend.username[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm text-white font-medium group-hover:text-[#E0FF62] transition-colors">
                                @{friend.username}
                              </p>
                              <p className="text-[10px] font-mono text-white/30">
                                Flex Score: {friend.flexScore} • {friend.winRate}% win rate
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-white/20 group-hover:text-[#E0FF62] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Select Side */}
                  {step === 'select-side' && selectedFriend && (
                    <motion.div
                      key="select-side"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4 block">
                        Pick your side
                      </label>

                      {/* VS Display */}
                      <div className="relative mb-6">
                        <div className="flex items-center justify-between">
                          {/* You */}
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#E0FF62]/20 to-[#E0FF62]/5 border border-[#E0FF62]/30 flex items-center justify-center mb-2">
                              <span className="text-xl font-bold text-[#E0FF62]">You</span>
                            </div>
                            <p className="text-xs font-mono text-white/50">Challenger</p>
                          </div>

                          {/* VS */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-[#0A0A0A] border border-white/[0.1] flex items-center justify-center">
                              <span className="text-xs font-mono text-white/40 font-bold">VS</span>
                            </div>
                          </div>

                          {/* Friend */}
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-white/[0.1] flex items-center justify-center mb-2">
                              <span className="text-xl font-bold text-white/60">
                                {selectedFriend.username[0].toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-white/50">@{selectedFriend.username}</p>
                          </div>
                        </div>
                      </div>

                      {/* Side Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          onClick={() => setYourSide('yes')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "p-4 rounded-xl border transition-all",
                            yourSide === 'yes'
                              ? "bg-[#FFD700]/10 border-[#FFD700]/40"
                              : "bg-white/[0.02] border-white/[0.06] hover:border-[#FFD700]/20"
                          )}
                        >
                          <div className="text-2xl font-bold text-[#FFD700] mb-1">YES</div>
                          <div className="text-xs font-mono text-white/40">{market.yesPrice}¢</div>
                          {yourSide === 'yes' && (
                            <div className="mt-2 text-[10px] font-mono text-[#E0FF62]">
                              @{selectedFriend.username} bets NO
                            </div>
                          )}
                        </motion.button>

                        <motion.button
                          onClick={() => setYourSide('no')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "p-4 rounded-xl border transition-all",
                            yourSide === 'no'
                              ? "bg-[#C0C0C0]/10 border-[#C0C0C0]/40"
                              : "bg-white/[0.02] border-white/[0.06] hover:border-[#C0C0C0]/20"
                          )}
                        >
                          <div className="text-2xl font-bold text-[#C0C0C0] mb-1">NO</div>
                          <div className="text-xs font-mono text-white/40">{market.noPrice}¢</div>
                          {yourSide === 'no' && (
                            <div className="mt-2 text-[10px] font-mono text-[#E0FF62]">
                              @{selectedFriend.username} bets YES
                            </div>
                          )}
                        </motion.button>
                      </div>

                      <button
                        onClick={() => setStep('select-stake')}
                        className="w-full mt-4 py-3 bg-[#E0FF62] text-black font-mono font-bold rounded-lg hover:bg-[#E0FF62]/90 transition-colors"
                      >
                        Continue
                      </button>

                      <button
                        onClick={() => setStep('select-friend')}
                        className="w-full mt-2 py-2 text-white/40 text-sm font-mono hover:text-white/60 transition-colors"
                      >
                        ← Back
                      </button>
                    </motion.div>
                  )}

                  {/* Step 3: Select Stake */}
                  {step === 'select-stake' && selectedFriend && (
                    <motion.div
                      key="select-stake"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-4 block">
                        Set your stake
                      </label>

                      {/* Stake options */}
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {STAKE_OPTIONS.map((amount) => (
                          <motion.button
                            key={amount}
                            onClick={() => setStake(amount)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "py-3 rounded-lg border font-mono text-sm font-bold transition-all",
                              stake === amount
                                ? "bg-[#E0FF62]/10 border-[#E0FF62]/40 text-[#E0FF62]"
                                : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:border-white/[0.1]"
                            )}
                          >
                            ${amount}
                          </motion.button>
                        ))}
                      </div>

                      {/* Custom stake input */}
                      <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono">$</span>
                        <input
                          type="number"
                          value={stake}
                          onChange={(e) => setStake(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-lg font-mono font-bold text-center focus:outline-none focus:border-[#E0FF62]/30 transition-colors"
                        />
                      </div>

                      {/* Summary */}
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-white/40">Your stake</span>
                          <span className="font-mono font-bold text-white">${stake} USDC</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-white/40">Their stake</span>
                          <span className="font-mono font-bold text-white">${stake} USDC</span>
                        </div>
                        <div className="h-px bg-white/[0.06] my-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-white/40">Winner takes</span>
                          <span className="font-mono font-bold text-[#E0FF62]">${stake * 2} USDC</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setStep('confirm')}
                        className="w-full py-3 bg-[#E0FF62] text-black font-mono font-bold rounded-lg hover:bg-[#E0FF62]/90 transition-colors"
                      >
                        Review Challenge
                      </button>

                      <button
                        onClick={() => setStep('select-side')}
                        className="w-full mt-2 py-2 text-white/40 text-sm font-mono hover:text-white/60 transition-colors"
                      >
                        ← Back
                      </button>
                    </motion.div>
                  )}

                  {/* Step 4: Confirm */}
                  {step === 'confirm' && selectedFriend && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center"
                    >
                      {/* VS Animation */}
                      <div className="relative py-8">
                        {/* Glow effect */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full bg-[#E0FF62]/10 blur-3xl" />
                        </div>

                        <div className="relative flex items-center justify-center gap-6">
                          {/* You */}
                          <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-center"
                          >
                            <div className={cn(
                              "w-20 h-20 rounded-full border-2 flex items-center justify-center mb-2",
                              yourSide === 'yes'
                                ? "bg-[#FFD700]/10 border-[#FFD700]/40"
                                : "bg-[#C0C0C0]/10 border-[#C0C0C0]/40"
                            )}>
                              <span className={cn(
                                "text-lg font-bold",
                                yourSide === 'yes' ? "text-[#FFD700]" : "text-[#C0C0C0]"
                              )}>
                                {yourSide.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-[#E0FF62]">You</p>
                          </motion.div>

                          {/* VS */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-12 h-12 rounded-full bg-[#E0FF62] flex items-center justify-center shadow-lg shadow-[#E0FF62]/30"
                          >
                            <span className="text-sm font-mono font-black text-black">VS</span>
                          </motion.div>

                          {/* Friend */}
                          <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-center"
                          >
                            <div className={cn(
                              "w-20 h-20 rounded-full border-2 flex items-center justify-center mb-2",
                              yourSide === 'no'
                                ? "bg-[#FFD700]/10 border-[#FFD700]/40"
                                : "bg-[#C0C0C0]/10 border-[#C0C0C0]/40"
                            )}>
                              <span className={cn(
                                "text-lg font-bold",
                                yourSide === 'no' ? "text-[#FFD700]" : "text-[#C0C0C0]"
                              )}>
                                {yourSide === 'yes' ? 'NO' : 'YES'}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-white/50">@{selectedFriend.username}</p>
                          </motion.div>
                        </div>
                      </div>

                      {/* Stakes */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6"
                      >
                        <p className="text-3xl font-mono font-black text-[#E0FF62] mb-1">
                          ${stake * 2}
                        </p>
                        <p className="text-xs font-mono text-white/40">Winner takes all</p>
                      </motion.div>

                      {/* Confirm button */}
                      <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={handleConfirm}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-[#E0FF62] text-black font-mono font-black text-lg rounded-xl hover:bg-[#E0FF62]/90 transition-colors shadow-lg shadow-[#E0FF62]/20"
                      >
                        Send Challenge
                      </motion.button>

                      <button
                        onClick={() => setStep('select-stake')}
                        className="w-full mt-3 py-2 text-white/40 text-sm font-mono hover:text-white/60 transition-colors"
                      >
                        ← Edit stake
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
