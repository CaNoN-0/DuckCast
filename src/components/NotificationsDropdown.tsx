/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, CheckCheck, TrendingUp, MessageSquare, ArrowUpRight } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'price' | 'thesis' | 'order';
  title: string;
  timeAgo: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMarketNotification?: (marketId: string) => void;
}

export function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: 'n-1',
      type: 'price',
      title: 'BTC > $120K moved to 78% (+6% in 2h)',
      timeAgo: '12m ago',
      read: false
    },
    {
      id: 'n-2',
      type: 'thesis',
      title: 'satoshiduck posted a top thesis on BTC ETF inflows',
      timeAgo: '45m ago',
      read: false
    },
    {
      id: 'n-3',
      type: 'order',
      title: 'Order filled: $25,000 in ETH > $4K YES contracts',
      timeAgo: '2h ago',
      read: true
    }
  ]);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-100">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#10b981]" />
          <span className="text-xs font-semibold text-[#09090B]">Notifications</span>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center gap-1 text-[11px] text-[#64748b] hover:text-[#09090B] cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      <div className="divide-y divide-neutral-100 my-2 max-h-72 overflow-y-auto">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`py-3 px-2 flex items-start gap-3 rounded-lg hover:bg-neutral-50 transition-colors ${
              !item.read ? 'bg-emerald-50/30' : ''
            }`}
          >
            <div className="mt-0.5 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
              {item.type === 'price' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
              {item.type === 'thesis' && <MessageSquare className="w-3.5 h-3.5 text-blue-600" />}
              {item.type === 'order' && <ArrowUpRight className="w-3.5 h-3.5 text-[#09090B]" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#09090B] leading-snug">
                {item.title}
              </p>
              <span className="text-[10px] text-[#94a3b8] font-mono-tabular">
                {item.timeAgo}
              </span>
            </div>

            {!item.read && (
              <span className="w-2 h-2 rounded-full bg-[#10b981] mt-1 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
