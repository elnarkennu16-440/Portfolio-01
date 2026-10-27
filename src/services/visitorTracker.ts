/**
 * @file visitorTracker.ts
 * Authentic Real-Time Live Presence Service for Kennu Elnar's Portfolio.
 *
 * Features:
 * 1. Tracks REAL-TIME concurrent live visitors ("X person / people viewing now").
 * 2. Starts authentically at 1 (the current visitor), never fake inflated numbers.
 * 3. Uses Supabase Realtime Presence channel (`online_presence`) for cross-browser, cross-device live tracking.
 * 4. Includes dual BroadcastChannel + heartbeat sync across tabs/windows on the same machine
 *    so testing in Chrome/Brave/multiple tabs works instantaneously even before Supabase env vars are set.
 * 5. Automatically cleans up when visitors close tab or disconnect.
 */

import {
  createClient,
  SupabaseClient,
  RealtimeChannel,
} from "@supabase/supabase-js";

export interface LivePresenceState {
  count: number;
  isLive: boolean;
  provider: "supabase_realtime" | "broadcast_presence";
}

type Listener = (state: LivePresenceState) => void;

const listeners: Set<Listener> = new Set();

// Active state: starts at 1 for the current viewer
let currentState: LivePresenceState = {
  count: 1,
  isLive: false,
  provider: "broadcast_presence",
};

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(currentState);
    } catch (err) {
      console.warn("[VisitorTracker] Listener error:", err);
    }
  });
}

// Generate or retrieve a persistent session key for this tab/visitor
function getVisitorSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  try {
    let id = sessionStorage.getItem("ke_presence_session_id");
    if (!id) {
      id =
        "v_" +
        Math.random().toString(36).substring(2, 9) +
        "_" +
        Date.now().toString(36);
      sessionStorage.setItem("ke_presence_session_id", id);
    }
    return id;
  } catch {
    return "session_" + Math.random().toString(36).substring(2, 9);
  }
}

// Safely retrieve Supabase credentials from Vite environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey.length > 20,
);

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let broadcastChannel: BroadcastChannel | null = null;
let heartbeatTimer: any = null;
let pruneTimer: any = null;
let isInitialized = false;

// Local tab presence registry for instant multi-tab testing
const LOCAL_HEARTBEAT_PREFIX = "ke_tab_presence_";

function updateLocalHeartbeat(sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${LOCAL_HEARTBEAT_PREFIX}${sessionId}`,
      String(Date.now()),
    );
  } catch {
    // Ignore storage quota
  }
}

function clearLocalHeartbeat(sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${LOCAL_HEARTBEAT_PREFIX}${sessionId}`);
  } catch {
    // Ignore
  }
}

function countActiveLocalTabs(): number {
  if (typeof window === "undefined") return 1;
  try {
    const now = Date.now();
    let count = 0;
    const thresholdMs = 12000; // Heartbeat valid for 12 seconds
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_HEARTBEAT_PREFIX)) {
        const lastSeen = Number(localStorage.getItem(key)) || 0;
        if (now - lastSeen < thresholdMs) {
          count++;
        } else {
          // Stale tab: clean up
          localStorage.removeItem(key);
        }
      }
    }
    return Math.max(1, count);
  } catch {
    return 1;
  }
}

/**
 * Initialize real-time presence connection
 */
export function initLivePresence(): () => void {
  if (typeof window === "undefined") return () => {};
  if (isInitialized) return () => {};
  isInitialized = true;

  const sessionId = getVisitorSessionId();
  updateLocalHeartbeat(sessionId);

  // Setup BroadcastChannel for zero-latency local multi-tab sync
  if (typeof BroadcastChannel !== "undefined") {
    try {
      broadcastChannel = new BroadcastChannel("ke_portfolio_presence_channel");
      broadcastChannel.onmessage = (event) => {
        if (
          event.data?.type === "JOIN" ||
          event.data?.type === "LEAVE" ||
          event.data?.type === "PING"
        ) {
          if (!supabaseClient || !isSupabaseConfigured) {
            const tabsCount = countActiveLocalTabs();
            currentState = {
              count: tabsCount,
              isLive: true,
              provider: "broadcast_presence",
            };
            notifyListeners();
          }
        }
      };

      // Announce this tab's join
      broadcastChannel.postMessage({ type: "JOIN", sessionId });
    } catch (err) {
      console.warn(
        "[VisitorTracker] BroadcastChannel not supported or blocked:",
        err,
      );
    }
  }

  // Periodic heartbeat to keep presence alive in localStorage
  heartbeatTimer = setInterval(() => {
    updateLocalHeartbeat(sessionId);
    if (!supabaseClient || !isSupabaseConfigured) {
      const tabsCount = countActiveLocalTabs();
      if (tabsCount !== currentState.count) {
        currentState = {
          count: tabsCount,
          isLive: true,
          provider: "broadcast_presence",
        };
        notifyListeners();
      }
    }
  }, 4000);

  // Setup Supabase Realtime if credentials exist
  if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      realtimeChannel = supabaseClient.channel("online_portfolio_presence", {
        config: {
          presence: {
            key: sessionId,
          },
        },
      });

      realtimeChannel
        .on("presence", { event: "sync" }, () => {
          if (!realtimeChannel) return;
          const presenceState = realtimeChannel.presenceState();
          const totalOnline = Object.keys(presenceState).length;
          currentState = {
            count: Math.max(1, totalOnline),
            isLive: true,
            provider: "supabase_realtime",
          };
          notifyListeners();
        })
        .on("presence", { event: "join" }, ({ key }) => {
          // Handled via sync, but ensures instant responsiveness
          if (realtimeChannel) {
            const state = realtimeChannel.presenceState();
            const count = Math.max(1, Object.keys(state).length);
            currentState = {
              count,
              isLive: true,
              provider: "supabase_realtime",
            };
            notifyListeners();
          }
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          if (realtimeChannel) {
            const state = realtimeChannel.presenceState();
            const count = Math.max(1, Object.keys(state).length);
            currentState = {
              count,
              isLive: true,
              provider: "supabase_realtime",
            };
            notifyListeners();
          }
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && realtimeChannel) {
            await realtimeChannel.track({
              online_at: new Date().toISOString(),
              device: /Mobi|Android/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop",
            });
            currentState = {
              ...currentState,
              isLive: true,
              provider: "supabase_realtime",
            };
            notifyListeners();
          }
        });
    } catch (err) {
      console.warn(
        "[VisitorTracker] Supabase Realtime error, falling back to local presence:",
        err,
      );
    }
  } else {
    // Immediate fallback initialization
    const initialTabs = countActiveLocalTabs();
    currentState = {
      count: initialTabs,
      isLive: true,
      provider: "broadcast_presence",
    };
    notifyListeners();
  }

  // Gracefully announce leave on window unload
  const handleUnload = () => {
    clearLocalHeartbeat(sessionId);
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: "LEAVE", sessionId });
      } catch {
        // Ignore
      }
    }
    if (realtimeChannel) {
      try {
        realtimeChannel.untrack();
      } catch {
        // Ignore
      }
    }
  };

  window.addEventListener("beforeunload", handleUnload);
  window.addEventListener("pagehide", handleUnload);

  return () => {
    handleUnload();
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (pruneTimer) clearInterval(pruneTimer);
    window.removeEventListener("beforeunload", handleUnload);
    window.removeEventListener("pagehide", handleUnload);
  };
}

/**
 * Subscribe a component to live presence changes
 */
export function subscribeToLivePresence(listener: Listener): () => void {
  listeners.add(listener);
  // Send current state immediately to the new listener
  listener(currentState);

  // Ensure service is running
  if (!isInitialized) {
    initLivePresence();
  }

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get current instantaneous snapshot
 */
export function getCurrentPresenceState(): LivePresenceState {
  return currentState;
}
