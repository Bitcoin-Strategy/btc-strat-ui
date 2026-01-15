import { toast } from 'sonner';

import { describeError, reportError } from './errors';

export type NotificationType = 'success' | 'error' | 'pending' | 'info';

export type TransactionType =
  | 'bond'
  | 'stake'
  | 'unstake'
  | 'redeem'
  | 'claim'
  | 'premiumSale'
  | 'swap'
  | 'approve'
  | 'vote'
  | 'connect'
  | 'disconnect'
  | 'write';

export interface Notification {
  id: string;
  type: NotificationType;
  transactionType: TransactionType;
  title: string;
  description?: string;
  hash?: `0x${string}`;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = 'mstrx_notifications';
const MAX_NOTIFICATIONS = 50;

export const getStoredNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Notification[];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: Notification[]): void => {
  try {
    const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  } catch {
    console.error('Failed to save notifications');
  }
};

export const addNotification = (
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
): Notification => {
  const newNotification: Notification = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    read: false,
  };

  const existing = getStoredNotifications();
  saveNotifications([newNotification, ...existing]);

  return newNotification;
};

export const markAsRead = (id: string): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  saveNotifications(updated);
};

export const markAllAsRead = (): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
};

export const clearAllNotifications = (): void => {
  saveNotifications([]);
};

export const getUnreadCount = (): number => {
  return getStoredNotifications().filter((n) => !n.read).length;
};

const TX_LABELS: Record<TransactionType, string> = {
  bond: 'Bond',
  stake: 'Stake',
  unstake: 'Unstake',
  redeem: 'Redeem',
  claim: 'Claim',
  premiumSale: 'Premium sale',
  swap: 'Swap',
  approve: 'Approve',
  vote: 'Vote',
  connect: 'Connect',
  disconnect: 'Disconnect',
  write: 'Write',
};

export const notifyTransaction = {
  pending: (txType: TransactionType, hash?: `0x${string}`) => {
    const title = `${TX_LABELS[txType]} pending...`;
    const description = hash
      ? `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`
      : undefined;

    toast.loading(title, {
      id: hash || txType,
      description,
    });

    addNotification({
      type: 'pending',
      transactionType: txType,
      title,
      description,
      hash,
    });
  },

  success: (
    txType: TransactionType,
    hash?: `0x${string}`,
    customDescription?: string,
  ) => {
    const title = `${TX_LABELS[txType]} successful!`;
    const description =
      customDescription ||
      (hash
        ? `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`
        : undefined);

    toast.success(title, {
      id: hash || txType,
      description,
    });

    addNotification({
      type: 'success',
      transactionType: txType,
      title,
      description,
      hash,
    });
  },

  /** Logs the raw error; the toast gets a readable message. A dismissed prompt is not reported. */
  error: (txType: TransactionType, cause?: unknown, hash?: `0x${string}`) => {
    const described =
      typeof cause === 'string'
        ? describeError(new Error(cause))
        : reportError(TX_LABELS[txType], cause);

    if (described.kind === 'rejected') {
      toast.info(described.title, {
        id: hash || txType,
        description: described.detail,
      });
      return;
    }

    const title = `${TX_LABELS[txType]} failed`;

    toast.error(title, {
      id: hash || txType,
      description: described.detail,
    });

    addNotification({
      type: 'error',
      transactionType: txType,
      title,
      description: described.detail,
      hash,
    });
  },

  info: (txType: TransactionType, message: string) => {
    toast.info(message);

    addNotification({
      type: 'info',
      transactionType: txType,
      title: message,
    });
  },
};

export const notifyWallet = {
  connected: (address: string) => {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    toast.success('Wallet connected', {
      description: shortAddress,
    });

    addNotification({
      type: 'success',
      transactionType: 'connect',
      title: 'Wallet connected',
      description: shortAddress,
    });
  },

  disconnected: () => {
    toast.info('Wallet disconnected');

    addNotification({
      type: 'info',
      transactionType: 'disconnect',
      title: 'Wallet disconnected',
    });
  },

  error: (cause: unknown) => {
    const described =
      typeof cause === 'string'
        ? describeError(new Error(cause))
        : reportError('wallet', cause);

    if (described.kind === 'rejected') {
      toast.info(described.title, { description: described.detail });
      return;
    }

    toast.error(described.title, { description: described.detail });

    addNotification({
      type: 'error',
      transactionType: 'connect',
      title: described.title,
      description: described.detail,
    });
  },
};
