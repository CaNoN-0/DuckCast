import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { RecentTrade } from '../../types/market';

interface LiveActivityFeedProps {
  initialTrades?: RecentTrade[];
  marketQuestion?: string;
  className?: string;
}

const DEFAULT_FEED_ITEMS: RecentTrade[] = [
  { id: 'f-1', user: '0x82F', side: 'YES', amount: '$420', shares: 617, price: 68, time: 'Just now', type: 'buy' },
  { id: 'f-2', user: 'Alex', side: 'YES', amount: '$1,200', shares: 1764, price: 68, time: '2m ago', type: 'buy' },
  { id: 'f-3', user: 'TraderX', side: 'NO', amount: '$780', shares: 2437, price: 32, time: '5m ago', type: 'buy' },
  { id: 'f-4', user: 'Market Engine', side: 'YES', amount: 'Vol shift', shares: 0, price: 66, time: '8m ago', type: 'prob_move', probMove: '61% → 66%' },
  { id: 'f-5', user: '0x49E', side: 'YES', amount: '$350', shares: 514, price: 68, time: '11m ago', type: 'buy' }
];

export function LiveActivityFeed({
  initialTrades,
  marketQuestion,
  className = ''
}: LiveActivityFeedProps) {
  const [feed, setFeed] = useState<RecentTrade[]>(
    initialTrades && initialTrades.length > 0 ? initialTrades : DEFAULT_FEED_ITEMS
  );

  // Subtle real-time simulation adding occasional realistic activity
  useEffect(() => {
    const mockUsers = ['0x82F', 'Alex', 'TraderX', 'CryptoQuack', 'Forecaster9', 'Whale_0x', 'Dara', 'Satoshi_Fan'];
    const interval = setInterval(() => {
      const isProbMove = Math.random() > 0.7;
      let newEntry: RecentTrade;

      if (isProbMove) {
        const fromProb = Math.floor(Math.random() * 20) + 50;
        const toProb = fromProb + (Math.random() > 0.5 ? 3 : -3);
        newEntry = {
          id: `live-${Date.now()}`,
          user: 'Market Engine',
          side: toProb > fromProb ? 'YES' : 'NO',
          amount: 'Vol shift',
          shares: 0,
          price: toProb,
          time: 'Just now',
          type: 'prob_move',
          probMove: `${fromProb}% → ${toProb}%`
        };
      } else {
        const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const side = Math.random() > 0.4 ? 'YES' : 'NO';
        const amounts = [120, 250, 420, 780, 1200, 2500];
        const amt = amounts[Math.floor(Math.random() * amounts.length)];
        newEntry = {
          id: `live-${Date.now()}`,
          user,
          side,
          amount: `$${amt.toLocaleString()}`,
          shares: Math.floor(amt * 1.4),
          price: side === 'YES' ? 68 : 32,
          time: 'Just now',
          type: 'buy'
        };
      }

      setFeed((prev) => [newEntry, ...prev.slice(0, 7)]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Live Activity Feed
          </h3>
        </div>
        <span className="text-[11px] font-mono-tabular text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
          Streaming
        </span>
      </div>

      <div className="divide-y divide-neutral-100/80 font-mono-tabular text-xs">
        {feed.map((item, idx) => {
          const isProbMove = item.type === 'prob_move' || Boolean(item.probMove);

          return (
            <div
              key={item.id}
              className={`py-2.5 flex items-center justify-between transition-all duration-300 ${
                idx === 0 ? 'bg-emerald-50/30 px-2 rounded-lg -mx-2' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isProbMove ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                    <TrendingUp className="w-3 h-3" />
                    PROB
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.side === 'YES'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.side}
                  </span>
                )}

                <span className="font-semibold text-neutral-800 truncate">
                  {item.user}
                </span>

                <span className="text-neutral-500 text-[11px] hidden sm:inline">
                  {isProbMove ? 'Probability moved' : (item.amount.includes('1,') ? 'increased' : 'bought')}
                </span>
              </div>

              <div className="text-right shrink-0 ml-3">
                {isProbMove ? (
                  <span className="font-bold text-purple-700 font-display">
                    {item.probMove}
                  </span>
                ) : (
                  <span className="font-black text-[#09090B]">
                    {item.amount}
                  </span>
                )}
                <span className="text-[10px] text-neutral-400 block font-normal">
                  {item.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
