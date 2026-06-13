"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Represents a pending action that was queued while offline.
 */
export interface QueuedAction {
  id: string;
  type: string;
  description: string;
  data: unknown;
  timestamp: number;
}

interface OfflineContextType {
  isOnline: boolean;
  queuedActions: QueuedAction[];
  queueAction: (type: string, description: string, data: unknown) => void;
  removeAction: (id: string) => void;
  clearQueue: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);
const QUEUE_STORAGE_KEY = "stellarspend_offline_queue";

function loadQueue(): QueuedAction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!savedQueue) {
    return [];
  }

  try {
    return JSON.parse(savedQueue) as QueuedAction[];
  } catch (error) {
    console.error("Failed to parse offline queue", error);
    return [];
  }
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
  );
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>(loadQueue);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queuedActions));
    }
  }, [queuedActions]);

  const queueAction = (type: string, description: string, data: unknown) => {
    const newAction: QueuedAction = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      description,
      data,
      timestamp: Date.now(),
    };
    setQueuedActions((prev) => [...prev, newAction]);
  };

  const removeAction = (id: string) => {
    setQueuedActions((prev) => prev.filter((action) => action.id !== id));
  };

  const clearQueue = () => setQueuedActions([]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queuedActions,
        queueAction,
        removeAction,
        clearQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}
