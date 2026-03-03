import { useEffect, useMemo, useState } from "react";
import BootScreen from "@/components/BootScreen";
import { useAuth } from "@/lib/auth";

type BootGateProps = {
  children: React.ReactNode;
};

export default function BootGate({ children }: BootGateProps) {
  const { user } = useAuth();

  const storageKey = useMemo(() => {
    return user?.uid ? `bootSeen:${user.uid}` : "bootSeen:guest";
  }, [user?.uid]);

  const isFirstTime = useMemo(() => {
    if (!user?.uid) return false;
    return localStorage.getItem(storageKey) !== "1";
  }, [storageKey, user?.uid]);

  // Always show boot when entering app while logged in
  const [showBoot, setShowBoot] = useState(true);

  useEffect(() => {
    setShowBoot(true);
  }, [user?.uid]);

  const finish = () => {
    if (user?.uid) localStorage.setItem(storageKey, "1");
    setShowBoot(false);
  };

  if (showBoot) {
    return (
      <BootScreen
        isFirstTime={isFirstTime}
        // slower + readable
        totalMs={isFirstTime ? 7500 : 5200}
        onDone={finish}
      />
    );
  }

  return <>{children}</>;
}
