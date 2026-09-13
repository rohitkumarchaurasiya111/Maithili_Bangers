import { useState, useEffect } from 'react';
import { ref, onValue, onDisconnect, set, push } from 'firebase/database';
import { database, isFirebaseConfigured } from '../utils/firebase';

const LISTENER_MIN = 24;
const LISTENER_MAX = 53;

export function useFirebasePresence() {
  const [listenerCount, setListenerCount] = useState(() =>
    Math.floor(Math.random() * (LISTENER_MAX - LISTENER_MIN + 1)) + LISTENER_MIN
  );

  useEffect(() => {
    // 1. If Firebase is configured, use it for presence
    if (isFirebaseConfigured && database) {
      const connectedRef = ref(database, '.info/connected');
      const listenersRef = ref(database, 'listeners');
      let myPresenceRef = null;

      // Track my presence
      const unsubscribeConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          myPresenceRef = push(listenersRef);
          onDisconnect(myPresenceRef).remove().then(() => {
            set(myPresenceRef, true);
          });
        }
      });

      // Listen to total listeners count
      const unsubscribeListeners = onValue(listenersRef, (snap) => {
        const activeListeners = snap.val();
        setListenerCount(activeListeners ? Object.keys(activeListeners).length : 0);
      });

      return () => {
        unsubscribeConnected();
        unsubscribeListeners();
        if (myPresenceRef) {
          set(myPresenceRef, null);
        }
      };
    } 
    
    // 2. Fallback: Simulate if not configured
    else {
      const interval = setInterval(() => {
        setListenerCount((prev) => {
          const change = Math.random() > 0.5 ? 1 : -1;
          const next = prev + change;
          if (next > LISTENER_MAX) return prev - 1;
          if (next < LISTENER_MIN) return prev + 1;
          return next;
        });
      }, 8000);

      return () => clearInterval(interval);
    }
  }, []);

  // Return the live count (or fallback to simulated logic if firebase isn't configured)
  return { listenerCount, isFirebaseConfigured };
}
