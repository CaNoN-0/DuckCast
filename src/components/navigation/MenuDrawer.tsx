import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Home,
  TrendingUp,
  Trophy,
  Bookmark,
  User,
  Settings,
  Wallet,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Lock,
  LogOut,
  Flame,
  Sparkles
} from 'lucide-react';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';
import { UserProfileData, DEFAULT_PROFILE } from '../../types/profile';
import { shortenSolanaAddress } from '../../solana/config';

export interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: 'home' | 'predictions' | 'profile';
  onNavigate: (page: 'home' | 'predictions' | 'profile') => void;
  onOpenLeaderboard: () => void;
  onOpenWatchlist: () => void;
  onOpenSettings: () => void;
  connectedWallet: {
    name: string;
    address: string;
    shortAddress?: string;
    networkName?: string;
    network?: string;
    usdcBalance?: number;
    formattedUsdcBalance?: string;
    solBalance?: number;
  } | null;
  onOpenWalletModal: () => void;
  onDisconnectWallet?: () => void;
  userProfile?: UserProfileData;
}

export function MenuDrawer({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  onOpenLeaderboard,
  onOpenWatchlist,
  onOpenSettings,
  connectedWallet,
  onOpenWalletModal,
  onDisconnectWallet,
  userProfile = DEFAULT_PROFILE
}: MenuDrawerProps) {
  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* 
            Background Overlay with smooth backdrop blur.
            Blurs the ENTIRE page behind the menu.
            Smooth fade in and fade out.
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Floating Side Menu / Navigation Panel with Slide In and Slide Out Animations */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{
              x: 0,
              transition: {
                type: 'spring',
                damping: 30,
                stiffness: 300,
                mass: 0.8
              }
            }}
            exit={{
              x: '100%',
              transition: {
                duration: 0.24,
                ease: [0.32, 0, 0.67, 0]
              }
            }}
            className="relative z-10 w-full max-w-[340px] sm:max-w-[360px] h-full bg-white border-l border-neutral-200/90 shadow-2xl flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header */}
            <div>
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { onNavigate('home'); onClose(); }}>
                  <div className="relative flex items-center justify-center w-7 h-7 transition-transform duration-200 group-hover:scale-110">
                    <img
                      src="/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg"
                      alt="DuckCast emblem"
                      className="w-7 h-7 object-contain mix-blend-multiply select-none"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[17px] font-bold font-display tracking-tight text-[#09090B]">
                    DuckCast
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-100 transition-all duration-200 hover:rotate-90 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wallet Identity / Connect Section - Squircle Card */}
              <div className="p-4 m-4 rounded-[18px] border border-neutral-200/90 bg-neutral-50/70 relative overflow-hidden transition-all duration-300 hover:shadow-xs group/card">
                <HalftoneBackground opacity={0.08} className="transition-opacity group-hover/card:opacity-14" />

                <div className="relative z-10">
                  {connectedWallet ? (
                    /* Connected State: Displays synchronized userProfile info across entire app */
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[8px] border border-emerald-200 font-mono-tabular">
                            Connected
                          </span>
                        </div>

                        {onDisconnectWallet && (
                          <button
                            type="button"
                            onClick={onDisconnectWallet}
                            className="text-[11px] text-neutral-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Disconnect Wallet"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Disconnect</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-[14px] overflow-hidden border border-neutral-300 bg-white shadow-2xs shrink-0 transition-transform duration-200 group-hover/card:scale-105">
                          <img
                            src={userProfile.avatarUrl}
                            alt={userProfile.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg';
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[#09090B] font-display truncate">
                            {userProfile.username}
                          </div>
                          <div className="text-xs text-neutral-500 font-mono-tabular truncate">
                            {connectedWallet.name} · {connectedWallet.shortAddress || shortenSolanaAddress(connectedWallet.address)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('profile');
                          onClose();
                        }}
                        className="w-full mt-3 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-[12px] text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Profile</span>
                      </button>
                    </div>
                  ) : (
                    /* Disconnected State: Prompt to Connect Wallet */
                    <div className="text-center py-1">
                      <div className="w-8 h-8 rounded-[10px] bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-500 group-hover/card:scale-110 transition-transform">
                        <Wallet className="w-4 h-4 text-neutral-700" />
                      </div>

                      <div className="text-xs font-bold text-[#09090B] mb-1">
                        Wallet Not Connected
                      </div>
                      <p className="text-[11px] text-neutral-500 mb-3 leading-snug">
                        Connect wallet to access your profile, active positions, and prediction track record.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenWalletModal();
                        }}
                        className="w-full py-2.5 px-3 bg-[#09090B] hover:bg-neutral-800 text-white rounded-[12px] text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5 flex items-center justify-center cursor-pointer"
                      >
                        <span>Connect Wallet</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Items List with Squircle Tabs and Micro-Animations */}
              <nav className="px-3 space-y-1">
                {/* Home Tab */}
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('home');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 ${
                    currentPage === 'home'
                      ? 'bg-neutral-100 text-[#09090B] shadow-2xs'
                      : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-neutral-500 group-hover:text-black group-hover:scale-110 transition-all duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Home</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-200" />
                </button>

                {/* Predictions Tab */}
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('predictions');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 ${
                    currentPage === 'predictions'
                      ? 'bg-neutral-100 text-[#09090B] shadow-2xs'
                      : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Predictions</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-[7px] border border-emerald-200">
                    Live
                  </span>
                </button>

                {/* Leaderboard Tab */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLeaderboard();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[13px] text-xs font-bold text-neutral-600 hover:text-[#09090B] hover:bg-neutral-50 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-500 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Leaderboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-200" />
                </button>

                {/* Watchlist Tab */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWatchlist();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[13px] text-xs font-bold text-neutral-600 hover:text-[#09090B] hover:bg-neutral-50 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Bookmark className="w-4 h-4 text-neutral-500 group-hover:text-emerald-600 group-hover:scale-110 transition-all duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Watchlist</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-200" />
                </button>

                {/* Profile Tab - Squircle & Animated */}
                {connectedWallet ? (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('profile');
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 ${
                      currentPage === 'profile'
                        ? 'bg-neutral-100 text-[#09090B] shadow-2xs'
                        : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-neutral-800 group-hover:text-black group-hover:scale-110 transition-all duration-200" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">Profile</span>
                    </div>
                  </button>
                ) : (
                  /* If wallet is NOT connected: Profile option is replaced with Connect Wallet */
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWalletModal();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[13px] text-xs font-bold text-neutral-600 hover:text-[#09090B] hover:bg-neutral-50 transition-all duration-200 cursor-pointer group"
                    title="Connect wallet to access Profile"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-neutral-400 group-hover:scale-110 transition-transform duration-200" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">Connect Wallet</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-normal">
                      <Lock className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                    </div>
                  </button>
                )}

                {/* Settings Tab */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[13px] text-xs font-bold text-neutral-600 hover:text-[#09090B] hover:bg-neutral-50 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-neutral-500 group-hover:rotate-45 group-hover:scale-110 transition-all duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-200" />
                </button>
              </nav>
            </div>

            {/* Footer Summary Card - Squircle */}
            <div className="p-4 m-3 rounded-[16px] bg-neutral-50/80 border border-neutral-100 text-xs text-neutral-500 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span>Active Markets</span>
                <span className="font-bold font-mono-tabular text-neutral-800">842</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>24h Volume</span>
                <span className="font-bold font-mono-tabular text-emerald-700">$14.2M</span>
              </div>
              <div className="pt-2 text-[10px] text-neutral-400 flex items-center justify-between border-t border-neutral-200/50">
                <span>DuckCast v2.4</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Operational
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * 3-Line Menu Button Component with Micro-Animations on every element!
 * - Hover translates each line with staggered micro-motion
 * - Squircle border radius (`rounded-[13px]`)
 * - Spring scale on click
 */
interface MenuButtonProps {
  onClick: () => void;
  className?: string;
}

export function MenuButton({ onClick, className = '' }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 sm:w-10 sm:h-10 flex flex-col items-center justify-center gap-[4.5px] bg-white hover:bg-neutral-50 active:scale-95 text-neutral-800 border border-neutral-200/90 hover:border-neutral-300 rounded-[13px] shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer group shrink-0 ${className}`}
      title="Open Menu"
      aria-label="Open Navigation Menu"
    >
      <span className="w-4.5 h-[1.75px] bg-neutral-800 group-hover:bg-black group-hover:translate-x-0.5 rounded-full transition-all duration-200 ease-out" />
      <span className="w-3.5 h-[1.75px] bg-neutral-800 group-hover:bg-black group-hover:w-4.5 group-hover:-translate-x-0.5 rounded-full transition-all duration-200 ease-out" />
      <span className="w-4.5 h-[1.75px] bg-neutral-800 group-hover:bg-black group-hover:translate-x-0.5 rounded-full transition-all duration-200 ease-out" />
    </button>
  );
}
