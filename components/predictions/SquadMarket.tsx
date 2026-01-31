'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * SquadMarket - Private group prediction markets
 *
 * Design: "The Inner Circle"
 * - Private squad markets for friend groups
 * - Fun, social, low-stakes predictions
 * - Examples: "Will @john liquidate his SOL before Friday?"
 * - Obsidian vault aesthetic with playful elements
 */

interface SquadMember {
  id: string;
  username: string;
  avatar?: string;
  position?: 'yes' | 'no';
  stake?: number;
}

interface SquadMarketProps {
  market: {
    id: string;
    question: string;
    createdBy: string;
    createdAt: string;
    expiresAt: string;
    totalPool: number;
    yesPool: number;
    noPool: number;
    status: 'open' | 'pending' | 'resolved';
    result?: 'yes' | 'no';
  };
  members: SquadMember[];
  currentUserId: string;
  onBet?: (side: 'yes' | 'no', amount: number) => void;
  onResolve?: (outcome: 'yes' | 'no') => void;
}

export function SquadMarket({
  market,
  members,
  currentUserId,
  onBet,
  onResolve,
}: SquadMarketProps) {
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [stakeAmount, setStakeAmount] = useState(5);
  const [showBetModal, setShowBetModal] = useState(false);

  const yesMembers = members.filter(m => m.position === 'yes');
  const noMembers = members.filter(m => m.position === 'no');
  const currentUser = members.find(m => m.id === currentUserId);
  const isCreator = market.createdBy === currentUserId;
  const hasPosition = !!currentUser?.position;

  // Time remaining
  const expiresDate = new Date(market.expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysLeft = Math.floor(hoursLeft / 24);
  const timeLabel = daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`;

  // Pool percentages
  const totalPool = market.yesPool + market.noPool;
  const yesPercent = totalPool > 0 ? Math.round((market.yesPool / totalPool) * 100) : 50;
  const noPercent = 100 - yesPercent;

  const handlePlaceBet = () => {
    if (selectedSide) {
      onBet?.(selectedSide, stakeAmount);
      setShowBetModal(false);
      setSelectedSide(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-[16px]",
          "bg-[#0A0A0A] border border-white/[0.06]",
          // Noise texture
          "before:absolute before:inset-0 before:opacity-[0.02]",
          "before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]",
          "before:pointer-events-none",
          market.status === 'resolved' && "opacity-80"
        )}
      >
        {/* Squad badge */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[10px] font-mono text-violet-400 uppercase tracking-wider flex items-center gap-1">
                <span className="text-xs">👥</span>
                Squad Market
              </span>
              {market.status === 'resolved' && (
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                  market.result === 'yes'
                    ? "bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]"
                    : "bg-[#C0C0C0]/10 border border-[#C0C0C0]/20 text-[#C0C0C0]"
                )}>
                  {market.result?.toUpperCase()} won
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/30">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{timeLabel}</span>
            </div>
          </div>

          {/* Question - playful style */}
          <h3 className="text-lg font-medium text-white mb-4 leading-snug">
            {market.question}
          </h3>

          {/* Pool visualization */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-[#FFD700]">YES {yesPercent}%</span>
              <span className="text-[#C0C0C0]">NO {noPercent}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yesPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFD700]/60 rounded-l-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${noPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#C0C0C0]/60 to-[#C0C0C0] rounded-r-full"
              />
            </div>
          </div>

          {/* Members positions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* YES side */}
            <div className="p-3 rounded-xl bg-[#FFD700]/5 border border-[#FFD700]/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-[#FFD700]">YES</span>
                <span className="text-[10px] font-mono text-white/30">${market.yesPool}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {yesMembers.length > 0 ? (
                  yesMembers.map((member) => (
                    <div
                      key={member.id}
                      className="w-7 h-7 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center"
                      title={`@${member.username} - $${member.stake}`}
                    >
                      <span className="text-[10px] font-bold text-[#FFD700]">
                        {member.username[0].toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] font-mono text-white/20">No bets yet</span>
                )}
              </div>
            </div>

            {/* NO side */}
            <div className="p-3 rounded-xl bg-[#C0C0C0]/5 border border-[#C0C0C0]/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-[#C0C0C0]">NO</span>
                <span className="text-[10px] font-mono text-white/30">${market.noPool}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {noMembers.length > 0 ? (
                  noMembers.map((member) => (
                    <div
                      key={member.id}
                      className="w-7 h-7 rounded-full bg-[#C0C0C0]/10 border border-[#C0C0C0]/30 flex items-center justify-center"
                      title={`@${member.username} - $${member.stake}`}
                    >
                      <span className="text-[10px] font-bold text-[#C0C0C0]">
                        {member.username[0].toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] font-mono text-white/20">No bets yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {market.status === 'open' && !hasPosition && (
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                onClick={() => {
                  setSelectedSide('yes');
                  setShowBetModal(true);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 hover:border-[#FFD700]/40 text-[#FFD700] font-mono font-bold transition-all"
              >
                Bet YES
              </motion.button>
              <motion.button
                onClick={() => {
                  setSelectedSide('no');
                  setShowBetModal(true);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 rounded-xl bg-[#C0C0C0]/10 border border-[#C0C0C0]/20 hover:border-[#C0C0C0]/40 text-[#C0C0C0] font-mono font-bold transition-all"
              >
                Bet NO
              </motion.button>
            </div>
          )}

          {hasPosition && market.status === 'open' && (
            <div className={cn(
              "p-3 rounded-xl text-center",
              currentUser?.position === 'yes'
                ? "bg-[#FFD700]/10 border border-[#FFD700]/20"
                : "bg-[#C0C0C0]/10 border border-[#C0C0C0]/20"
            )}>
              <span className="text-sm font-mono">
                You bet{' '}
                <span className={cn(
                  "font-bold",
                  currentUser?.position === 'yes' ? "text-[#FFD700]" : "text-[#C0C0C0]"
                )}>
                  {currentUser?.position?.toUpperCase()}
                </span>
                {' '}• ${currentUser?.stake}
              </span>
            </div>
          )}

          {/* Resolve button for creator */}
          {isCreator && market.status === 'pending' && (
            <div className="mt-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
              <p className="text-xs font-mono text-white/50 mb-3 text-center">
                Market ended. What was the outcome?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onResolve?.('yes')}
                  className="py-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-sm font-mono font-bold hover:bg-[#FFD700]/20 transition-colors"
                >
                  YES won
                </button>
                <button
                  onClick={() => onResolve?.('no')}
                  className="py-2 rounded-lg bg-[#C0C0C0]/10 border border-[#C0C0C0]/30 text-[#C0C0C0] text-sm font-mono font-bold hover:bg-[#C0C0C0]/20 transition-colors"
                >
                  NO won
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
            <span className="text-[10px] font-mono text-white/30">
              Created by @{market.createdBy}
            </span>
            <span className="text-[10px] font-mono text-white/30">
              Pool: ${market.totalPool}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Bet Modal */}
      <AnimatePresence>
        {showBetModal && selectedSide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBetModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[20%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm z-50"
            >
              <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-[16px] p-5">
                <div className="text-center mb-6">
                  <div className={cn(
                    "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3",
                    selectedSide === 'yes'
                      ? "bg-[#FFD700]/10 border-2 border-[#FFD700]/30"
                      : "bg-[#C0C0C0]/10 border-2 border-[#C0C0C0]/30"
                  )}>
                    <span className={cn(
                      "text-2xl font-bold",
                      selectedSide === 'yes' ? "text-[#FFD700]" : "text-[#C0C0C0]"
                    )}>
                      {selectedSide.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">How much do you want to bet?</p>
                </div>

                {/* Stake options */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setStakeAmount(amount)}
                      className={cn(
                        "py-2 rounded-lg font-mono text-sm font-bold transition-all",
                        stakeAmount === amount
                          ? selectedSide === 'yes'
                            ? "bg-[#FFD700]/10 border border-[#FFD700]/40 text-[#FFD700]"
                            : "bg-[#C0C0C0]/10 border border-[#C0C0C0]/40 text-[#C0C0C0]"
                          : "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60"
                      )}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePlaceBet}
                  className={cn(
                    "w-full py-3 rounded-xl font-mono font-bold text-black transition-colors",
                    selectedSide === 'yes'
                      ? "bg-[#FFD700] hover:bg-[#FFD700]/90"
                      : "bg-[#C0C0C0] hover:bg-[#C0C0C0]/90"
                  )}
                >
                  Place ${stakeAmount} on {selectedSide.toUpperCase()}
                </button>

                <button
                  onClick={() => setShowBetModal(false)}
                  className="w-full mt-2 py-2 text-white/40 text-sm font-mono hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * CreateSquadMarketModal - Create a new squad market
 */
interface CreateSquadMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  squadMembers: { id: string; username: string }[];
  onCreate: (question: string, expiresInHours: number) => void;
}

export function CreateSquadMarketModal({
  isOpen,
  onClose,
  squadMembers,
  onCreate,
}: CreateSquadMarketModalProps) {
  const [question, setQuestion] = useState('');
  const [expiresIn, setExpiresIn] = useState(24);
  const [mentionedUser, setMentionedUser] = useState('');

  const suggestions = [
    `Will @${squadMembers[0]?.username || 'friend'} paper hand before Friday?`,
    `Will @${squadMembers[0]?.username || 'friend'} hit a 5-win streak this week?`,
    `Will we see $100K Bitcoin before the month ends?`,
    `Will @${squadMembers[0]?.username || 'friend'}'s next prediction be correct?`,
  ];

  const handleCreate = () => {
    if (question.trim()) {
      onCreate(question, expiresIn);
      onClose();
      setQuestion('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-[16px] overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <span className="text-lg">🎲</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-serif text-white" style={{ fontFamily: "'Cormorant Garabond', serif" }}>
                        Create Squad Market
                      </h2>
                      <p className="text-xs font-mono text-white/40">Bet with your friends</p>
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
              </div>

              {/* Content */}
              <div className="p-5">
                <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2 block">
                  Your question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Will @friend do something by when?"
                  className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 transition-colors font-mono text-sm resize-none"
                />

                {/* Suggestions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(suggestion)}
                      className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04] text-[10px] font-mono text-white/40 hover:text-white/60 hover:border-white/[0.08] transition-colors"
                    >
                      {suggestion.slice(0, 40)}...
                    </button>
                  ))}
                </div>

                {/* Expires in */}
                <div className="mt-6">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2 block">
                    Expires in
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[12, 24, 48, 168].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setExpiresIn(hours)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-mono font-bold transition-all",
                          expiresIn === hours
                            ? "bg-violet-500/10 border border-violet-500/40 text-violet-400"
                            : "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60"
                        )}
                      >
                        {hours < 24 ? `${hours}h` : `${hours / 24}d`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create button */}
                <button
                  onClick={handleCreate}
                  disabled={!question.trim()}
                  className={cn(
                    "w-full mt-6 py-3 rounded-xl font-mono font-bold transition-all",
                    question.trim()
                      ? "bg-[#E0FF62] text-black hover:bg-[#E0FF62]/90"
                      : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                  )}
                >
                  Create Squad Market
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
