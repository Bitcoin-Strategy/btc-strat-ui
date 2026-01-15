import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Check,
  CheckCircle,
  Coins,
  Gavel,
  Loader2,
  Plug,
  Repeat,
  Trash2,
  Vote,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { useNotifications } from '../../../hooks/use-notifications';
import { cn } from '../../../lib';
import type { Notification, TransactionType } from '../../../lib/notifications';

const TX_ICONS: Record<TransactionType, React.ReactNode> = {
  bond: <Coins size={16} />,
  stake: <ArrowUpFromLine size={16} />,
  unstake: <ArrowDownToLine size={16} />,
  redeem: <ArrowDownToLine size={16} />,
  claim: <Wallet size={16} />,
  premiumSale: <Gavel size={16} />,
  swap: <Repeat size={16} />,
  approve: <Check size={16} />,
  vote: <Vote size={16} />,
  connect: <Plug size={16} />,
  disconnect: <Plug size={16} />,
  write: <Check size={16} />,
};

const STATUS_COLORS = {
  success: 'text-green',
  error: 'text-red',
  pending: 'text-yellow',
  info: 'text-blue',
};

const STATUS_ICONS = {
  success: <CheckCircle size={14} className="text-green" />,
  error: <XCircle size={14} className="text-red" />,
  pending: <Loader2 size={14} className="text-yellow animate-spin" />,
  info: <Bell size={14} className="text-blue" />,
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.hash) {
      window.open(`https://etherscan.io/tx/${notification.hash}`, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'hover:bg-card flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        !notification.read && 'bg-card/50',
      )}
    >
      <div
        className={cn(
          'bg-card flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          STATUS_COLORS[notification.type],
        )}
      >
        {TX_ICONS[notification.transactionType]}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">
            {notification.title}
          </span>
          {STATUS_ICONS[notification.type]}
        </div>
        {notification.description && (
          <p className="text-muted mt-0.5 truncate text-xs">
            {notification.description}
          </p>
        )}
        <p className="text-muted mt-1 text-xs">
          {formatTimeAgo(notification.timestamp)}
        </p>
      </div>

      {!notification.read && (
        <span className="bg-orange mt-2 h-2 w-2 shrink-0 rounded-full" />
      )}
    </button>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted relative p-2 transition-colors hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bg-orange absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="border-border bg-dark absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-2xl"
        >
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-muted text-xs transition-colors hover:text-white"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-muted hover:text-red p-1 transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-muted flex flex-col items-center justify-center py-8">
                <Bell size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-border divide-y">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
