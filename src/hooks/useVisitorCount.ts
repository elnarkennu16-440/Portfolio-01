import { useState, useEffect } from "react";
import {
  subscribeToLivePresence,
  getCurrentPresenceState,
  LivePresenceState,
} from "../services/visitorTracker";

export function useVisitorCount() {
  const [state, setState] = useState<LivePresenceState>(
    getCurrentPresenceState,
  );
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToLivePresence((newState) => {
      setState(newState);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    count: state.count,
    isLive: state.isLive,
    provider: state.provider,
    loading,
  };
}
