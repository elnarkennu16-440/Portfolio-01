/**
 * @file visitorTracker.ts
 * Authentic Real-Time Live Presence Service for Kennu Elnar's Portfolio.
 *
 * - Tracks REAL-TIME concurrent live viewers across ALL browsers/devices
 *   through a Supabase Realtime Presence channel.
 * - Starts at 1 (the current viewer), never inflated.
 * - Falls back to a same-browser tab counter (BroadcastChannel + localStorage)
 *   ONLY when Supabase is not configured or temporarily disconnected.
 * - Auto-reconnects and re-tracks after mobile backgrounding / bfcache restore.
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

function setState(next: LivePresenceState) {
  currentState = next;
  notifyListeners();
}

// Persistent session key for this tab/visitor
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

// Supabase credentials from Vite env (build-time)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey.length > 20,
);

const RECONNECT_DELAY_MS = 3000;

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let supabaseConnected = false;
let broadcastChannel: BroadcastChannel | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;

// ---------- Local (same-browser) fallback ----------
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
    const thresholdMs = 12000;
    const staleKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_HEARTBEAT_PREFIX)) {
        const lastSeen = Number(localStorage.getItem(key)) || 0;
        if (now - lastSeen < thresholdMs) {
          count++;
        } else {
          staleKeys.push(key);
        }
      }
    }
    staleKeys.forEach((k) => localStorage.removeItem(k));
    return Math.max(1, count);
  } catch {
    return 1;
  }
}

function applyLocalCount() {
  const tabsCount = countActiveLocalTabs();
  if (
    tabsCount !== currentState.count ||
    currentState.provider !== "broadcast_presence" ||
    !currentState.isLive
  ) {
    setState({
      count: tabsCount,
      isLive: true,
      provider: "broadcast_presence",
    });
  }
}

// ---------- Supabase Realtime ----------
function trackPayload() {
  return {
    online_at: new Date().toISOString(),
    device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
  };
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect(sessionId: string) {
  if (!isInitialized || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (isInitialized) connectSupabase(sessionId);
  }, RECONNECT_DELAY_MS);
}

function connectSupabase(sessionId: string) {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return;

  try {
    if (!supabaseClient) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
    }

    // Drop any previous channel before creating a new one
    if (realtimeChannel) {
      const old = realtimeChannel;
      realtimeChannel = null;
      supabaseClient.removeChannel(old);
    }

    const channel = supabaseClient.channel("online_portfolio_presence", {
      config: { presence: { key: sessionId } },
    });
    realtimeChannel = channel;

    const syncCount = () => {
      if (channel !== realtimeChannel) return;
      const total = Object.keys(channel.presenceState()).length;
      setState({
        count: Math.max(1, total),
        isLive: true,
        provider: "supabase_realtime",
      });
    };

    channel
      .on("presence", { event: "sync" }, syncCount)
      .on("presence", { event: "join" }, syncCount)
      .on("presence", { event: "leave" }, syncCount)
      .subscribe(async (status) => {
        // Ignore events from channels we already replaced
        if (channel !== realtimeChannel) return;

        if (status === "SUBSCRIBED") {
          supabaseConnected = true;
          clearReconnectTimer();
          try {
            await channel.track(trackPayload());
          } catch (err) {
            console.warn("[VisitorTracker] track() failed:", err);
          }
          syncCount();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.warn(
            `[VisitorTracker] Supabase channel ${status}. Using local count and retrying...`,
          );
          supabaseConnected = false;
          applyLocalCount();
          scheduleReconnect(sessionId);
        }
      });
  } catch (err) {
    console.warn("[VisitorTracker] Supabase Realtime error:", err);
    supabaseConnected = false;
    applyLocalCount();
    scheduleReconnect(sessionId);
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

  if (!isSupabaseConfigured) {
    console.warn(
      "[VisitorTracker] Supabase is NOT configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in this build). " +
        "Counting only tabs in THIS browser. Add the env vars in your host (e.g. Vercel) and redeploy.",
    );
  }

  // BroadcastChannel for instant same-browser tab sync (fallback only)
  if (typeof BroadcastChannel !== "undefined") {
    try {
      broadcastChannel = new BroadcastChannel("ke_portfolio_presence_channel");
      broadcastChannel.onmessage = (event) => {
        const type = event.data?.type;
        if (type === "JOIN" || type === "LEAVE" || type === "PING") {
          if (!supabaseConnected) applyLocalCount();
        }
      };
      broadcastChannel.postMessage({ type: "JOIN", sessionId });
    } catch (err) {
      console.warn("[VisitorTracker] BroadcastChannel unavailable:", err);
    }
  }

  // Heartbeat keeps local presence alive (local count only used if Supabase is down)
  heartbeatTimer = setInterval(() => {
    updateLocalHeartbeat(sessionId);
    if (!supabaseConnected) applyLocalCount();
  }, 4000);

  if (isSupabaseConfigured) {
    connectSupabase(sessionId);
  } else {
    applyLocalCount();
  }

  // Leave handling
  const handleLeave = () => {
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

  // Come back (tab focus, mobile app switch, bfcache restore, return from FB browser)
  const handleReturn = () => {
    updateLocalHeartbeat(sessionId);
    if (!isSupabaseConfigured) {
      applyLocalCount();
      return;
    }
    if (realtimeChannel && supabaseConnected) {
      realtimeChannel.track(trackPayload()).catch(() => {
        // Connection may be stale: rebuild it
        supabaseConnected = false;
        connectSupabase(sessionId);
      });
    } else {
      clearReconnectTimer();
      connectSupabase(sessionId);
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") handleReturn();
  };

  const handlePageShow = (e: PageTransitionEvent) => {
    if (e.persisted) handleReturn();
  };

  window.addEventListener("beforeunload", handleLeave);
  window.addEventListener("pagehide", handleLeave);
  window.addEventListener("pageshow", handlePageShow);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    handleLeave();
    clearReconnectTimer();
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    if (supabaseClient && realtimeChannel) {
      const ch = realtimeChannel;
      realtimeChannel = null;
      supabaseClient.removeChannel(ch);
    }
    supabaseConnected = false;
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {
        // Ignore
      }
      broadcastChannel = null;
    }
    window.removeEventListener("beforeunload", handleLeave);
    window.removeEventListener("pagehide", handleLeave);
    window.removeEventListener("pageshow", handlePageShow);
    document.removeEventListener("visibilitychange", handleVisibility);
    isInitialized = false;
  };
}

/**
 * Subscribe a component to live presence changes
 */
export function subscribeToLivePresence(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentState);

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
