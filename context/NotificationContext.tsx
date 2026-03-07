"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = "stellarspend_notifications";
const PREFS_KEY = "stellarspend_notification_preferences";

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Initialize with saved notifications from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved notifications', e);
        }
      }
    }
    return [];
  });

  const [toasts, setToasts] = useState<Notification[]>([]);

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    // Initialize with saved preferences from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved preferences', e);
        }
      }
    }
    return {
      success: true,
      error: true,
      info: true,
    };
  });

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      message,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Only show toast if preference is enabled
    if (preferences[type]) {
      setToasts((prev) => [...prev, newNotification]);
      
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        removeToast(newNotification.id);
      }, 5000);
    }
  }, [preferences, removeToast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  }, []);

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
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
