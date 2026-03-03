import { useEffect, useMemo, useState } from "react";
import BootScreen from "@/components/BootScreen";
import { useAuth } from "@/lib/auth";

type BootGateProps = {
  children: React.ReactNode;
};

export default function BootGate({ children }: BootGateProps) {
  const { user } = useAuth();
  const uid = user?.uid;

  // localStorage = permanent "first time ever" memory
  const firstTimeKey = useMemo(() => {
    return uid ? `bootSeen:${uid}` : "bootSeen:guest";
  }, [uid]);

  // sessionStorage = "don’t show again in this tab/session" memory
  const sessionKey = useMemo(() => {
    return uid ? `bootSessionSeen:${uid}` : "bootSessionSeen:guest";
  }, [uid]);

  const isFirstTimeEver = useMemo(() => {
    if (!uid) return false;
    return localStorage.getItem(firstTimeKey) !== "1";
  }, [firstTimeKey, uid]);

  const [showBoot, setShowBoot] = useState(false);

  useEffect(() => {
    // Only decide once we know who the user is
    if (!uid) {
      // If not logged in, BootGate shouldn't matter anyway (ProtectedRoute blocks)
      setShowBoot(false);
      return;
    }

    // If boot already shown in THIS session/tab, don't show again (prevents refresh boot)
    const alreadyThisSession = sessionStorage.getItem(sessionKey) === "1";
    setShowBoot(!alreadyThisSession);
  }, [uid, sessionKey]);

  const finish = () => {
    if (uid) {
      // Mark first-time-ever as seen (so future sessions use the shorter boot)
      localStorage.setItem(firstTimeKey, "1");

      // Mark this session as seen (so refresh won't boot again)
      sessionStorage.setItem(sessionKey, "1");
    }
    setShowBoot(false);
  };

  if (showBoot) {
    return (
      <BootScreen
        isFirstTime={isFirstTimeEver}
        totalMs={isFirstTimeEver ? 7500 : 5200}
        onDone={finish}
      />
    );
  }

  return <>{children}</>;
}
