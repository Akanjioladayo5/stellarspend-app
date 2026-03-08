"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface NotificationPreferences {
  success: boolean;
  error: boolean;
  info: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  toasts: Notification[];
  addNotification: (type: NotificationType, message: string) => void;
  markAsRead: (id: string) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "stellarspend_notifications";
const PREFS_KEY = "stellarspend_notification_preferences";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  success: true,
  error: true,
  info: true,
};

function loadNotifications(): Notification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Notification[]) : [];
  } catch {
    return [];
  }
}

function loadPreferences(): NotificationPreferences {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    return saved
      ? (JSON.parse(saved) as NotificationPreferences)
      : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Lazy initialisers read localStorage once on mount — no setState inside effects
  const [notifications, setNotifications] =
    useState<Notification[]>(loadNotifications);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(loadPreferences);

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Persist preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback(
    (type: NotificationType, message: string) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(2, 11),
        type,
        message,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      if (preferences[type]) {
        setToasts((prev) => [...prev, newNotification]);

        setTimeout(() => {
          removeToast(newNotification.id);
        }, 5000);
      }
    },
    [preferences, removeToast],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback(
    (newPrefs: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...newPrefs }));
    },
    [],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        addNotification,
        markAsRead,
        removeToast,
        clearAll,
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
