/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PredictionsMarketplace } from './components/marketplace/PredictionsMarketplace';
import { MenuDrawer, MenuButton } from './components/navigation/MenuDrawer';
import { ProfilePage } from './components/profile/ProfilePage';
import { LeaderboardModal } from './components/navigation/LeaderboardModal';
import { WatchlistModal } from './components/navigation/WatchlistModal';
import { SettingsModal } from './components/navigation/SettingsModal';
import { WalletProvider, useSolanaWallet } from './wallet/WalletContext';
import { shortenSolanaAddress } from './solana/config';
import { MarketsProvider, useMarkets } from './context/MarketsContext';
import { UserProfileData, DEFAULT_PROFILE } from './types/profile';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'home' | 'predictions' | 'profile'>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    connectedWallet,
    openWalletModal,
    disconnectWallet
  } = useSolanaWallet();
  const { markets } = useMarkets();

  // Synchronized Profile State per connected wallet address
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem('duckcast_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PROFILE;
  });

  // Whenever wallet changes, associate profile with the connected wallet address
  useEffect(() => {
    if (connectedWallet?.address) {
      try {
        const key = `duckcast_profile_${connectedWallet.address.toLowerCase()}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          setUserProfile(JSON.parse(saved));
        } else {
          // Associate the actual connected wallet address with the initial profile
          const initial = {
            ...DEFAULT_PROFILE,
            username: `Predictor_${connectedWallet.address.slice(2, 6)}`
          };
          setUserProfile(initial);
          localStorage.setItem(key, JSON.stringify(initial));
        }
      } catch {}
    }
  }, [connectedWallet?.address]);

  const handleUpdateProfile = (updated: Partial<UserProfileData>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      try {
        if (connectedWallet?.address) {
          localStorage.setItem(
            `duckcast_profile_${connectedWallet.address.toLowerCase()}`,
            JSON.stringify(next)
          );
        }
        localStorage.setItem('duckcast_user_profile', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // If on predictions page
  if (currentPage === 'predictions') {
    return (
      <>
        <PredictionsMarketplace
          onBackToHome={() => setCurrentPage('home')}
          connectedWallet={connectedWallet}
          onOpenWalletModal={openWalletModal}
          onOpenMenu={() => setMenuOpen(true)}
        />

        {/* Global Floating Side Menu */}
        <MenuDrawer
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
          onOpenWatchlist={() => setWatchlistModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          connectedWallet={connectedWallet}
          onOpenWalletModal={openWalletModal}
          onDisconnectWallet={disconnectWallet}
          userProfile={userProfile}
        />

        {/* Modals */}
        <LeaderboardModal
          isOpen={leaderboardModalOpen}
          onClose={() => setLeaderboardModalOpen(false)}
        />
        <WatchlistModal
          isOpen={watchlistModalOpen}
          onClose={() => setWatchlistModalOpen(false)}
          markets={markets}
          onSelectMarket={() => setCurrentPage('predictions')}
          onNavigateToPredictions={() => setCurrentPage('predictions')}
        />
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />
      </>
    );
  }

  // If on profile page
  if (currentPage === 'profile') {
    return (
      <>
        <ProfilePage
          connectedWallet={connectedWallet}
          onOpenWalletModal={openWalletModal}
          onNavigateToPredictions={() => setCurrentPage('predictions')}
          onNavigateToHome={() => setCurrentPage('home')}
          allMarkets={markets}
          onSelectMarket={() => setCurrentPage('predictions')}
          onOpenMenu={() => setMenuOpen(true)}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Global Floating Side Menu */}
        <MenuDrawer
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
          onOpenWatchlist={() => setWatchlistModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          connectedWallet={connectedWallet}
          onOpenWalletModal={openWalletModal}
          onDisconnectWallet={disconnectWallet}
          userProfile={userProfile}
        />

        {/* Modals */}
        <LeaderboardModal
          isOpen={leaderboardModalOpen}
          onClose={() => setLeaderboardModalOpen(false)}
        />
        <WatchlistModal
          isOpen={watchlistModalOpen}
          onClose={() => setWatchlistModalOpen(false)}
          markets={markets}
          onSelectMarket={() => setCurrentPage('predictions')}
          onNavigateToPredictions={() => setCurrentPage('predictions')}
        />
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />
      </>
    );
  }

  // Home Page (100% Unchanged Design)
  return (
    <div className="relative overflow-hidden min-h-screen w-full text-[#09090B] flex flex-col justify-between items-center px-6 py-9 md:py-12 select-none">
      {/* Fullscreen Homepage Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="homepage-bg-video fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
      >
        <source src={new URL('../bgvid.mp4', import.meta.url).href} type="video/mp4" />
        <source src="/bgvid.mp4" type="video/mp4" />
      </video>

      {/* Top-Left Halftone Dot Matrix Element */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[1]"
        aria-hidden="true"
      >
        <svg
          width="336"
          height="264"
          viewBox="0 0 336 264"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[210px] sm:w-[280px] md:w-[336px] h-auto block"
        >
          {Array.from({ length: 22 }).map((_, row) =>
            Array.from({ length: 28 }).map((__, col) => {
              const spacing = 12;
              const xFactor = Math.pow(1 - col / 28.5, 1.15);
              const yFactor = Math.pow(1 - row / 22.5, 1.15);
              const radius = 5.5 * xFactor * yFactor;
              const cx = col * spacing + 5.5;
              const cy = row * spacing + 5.5;
              if (radius < 0.35) return null;
              return (
                <circle
                  key={`${row}-${col}`}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="#09090B"
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Top Center Wordmark + 3-Line Menu Button */}
      <header className="relative z-10 w-full flex justify-center items-center pt-1 px-4 sm:px-6">
        <div className="inline-flex items-center gap-0">
          <div className="relative flex items-center justify-center w-12 h-14 -mr-1">
            {!imageError ? (
              <img
                src="/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg"
                alt="DuckCast minimalist duck emblem"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-14 h-14 object-contain mix-blend-multiply select-none pointer-events-none"
              />
            ) : (
              <svg
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12"
                aria-label="DuckCast minimalist duck emblem"
              >
                <path
                  d="M21 44C15.5 44 12 40.2 12 35.5C12 31.2 15.2 28.5 19.5 28.5C21.2 28.5 22.8 28.9 24 29.5C24.4 22.5 29.2 18 35.5 18C41.2 18 45.5 22.1 45.5 27.6C45.5 30.1 44.5 32.3 43 33.9C45.2 35.4 46.5 37.8 46.5 40.5C46.5 42.8 44.8 44 42 44H21Z"
                  stroke="#09090B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M45.5 26.5H51.5C52.6 26.5 53.5 27.4 53.5 28.5C53.5 29.6 52.6 30.5 51.5 30.5H45"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="38.5" cy="25.5" r="1.5" fill="#09090B" />
                <path
                  d="M24 36.5C27.5 38 32 37.5 34.5 35"
                  stroke="#09090B"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <span className="text-[19px] font-bold font-display tracking-[-0.03em] text-[#09090B] -ml-0.5">
            DuckCast
          </span>
        </div>

        {/* Minimal 3-Line Menu Button placed at top of the page */}
        <div className="absolute right-4 sm:right-6 top-1.5 sm:top-2">
          <MenuButton onClick={() => setMenuOpen(true)} />
        </div>
      </header>

      {/* Main Centered Hero Composition */}
      <main className="relative z-10 w-full max-w-[660px] mx-auto flex flex-col items-center text-center my-auto py-8">
        <h1
          className="text-[44px] sm:text-[58px] md:text-[68px] font-bold font-display tracking-[-0.04em] leading-[1.03] text-[#09090B] mb-5"
          style={{ textWrap: 'balance' }}
        >
          Predict what happens next.
        </h1>

        <p
          className="text-[16px] sm:text-[18px] leading-[1.6] text-[#52525B] font-medium max-w-[520px] mb-9"
          style={{ textWrap: 'balance' }}
        >
          DuckCast is a social prediction market where you make predictions, back your thesis, and see how your track record stacks up.
        </p>

        {/* Two Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={openWalletModal}
            className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 h-[46px] bg-[#09090B] text-white text-[14px] font-semibold tracking-[-0.01em] rounded-lg border border-[#09090B] hover:bg-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto shadow-xs"
          >
            <span>
              {connectedWallet
                ? `Connected (${connectedWallet.shortAddress || shortenSolanaAddress(connectedWallet.address)})`
                : 'Connect Wallet'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('predictions')}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 h-[46px] bg-white text-[#09090B] text-[14px] font-semibold tracking-[-0.01em] rounded-lg border-2 border-[#09090B] hover:border-[#10B981] hover:text-[#09090B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto shadow-xs"
          >
            <span>View Available Predictions</span>
          </button>
        </div>
      </main>

      {/* Lower Portion: Subtle Bottom Line */}
      <footer className="relative z-10 w-full flex flex-col items-center justify-center gap-3.5 pb-1">
        <p className="text-[13px] font-semibold tracking-[0.04em] uppercase text-[#71717A]">
          Predict. Explain. Compete.
        </p>
      </footer>

      {/* Global Floating Side Menu */}
      <MenuDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
        onOpenWatchlist={() => setWatchlistModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        connectedWallet={connectedWallet}
        onOpenWalletModal={openWalletModal}
        onDisconnectWallet={disconnectWallet}
        userProfile={userProfile}
      />

      {/* Modals */}
      <LeaderboardModal
        isOpen={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
      />
      <WatchlistModal
        isOpen={watchlistModalOpen}
        onClose={() => setWatchlistModalOpen(false)}
        markets={markets}
        onSelectMarket={() => setCurrentPage('predictions')}
        onNavigateToPredictions={() => setCurrentPage('predictions')}
      />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <MarketsProvider>
        <AppContent />
      </MarketsProvider>
    </WalletProvider>
  );
}
