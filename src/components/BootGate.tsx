import { useEffect, useMemo, useState } from "react";
import BootScreen from "@/components/BootScreen";
import { useAuth } from "@/lib/auth";

type BootGateProps = {
  children: React.ReactNode;
};

export default function BootGate({ children }: BootGateProps) {
  const { user } = useAuth();
  const [showBoot, setShowBoot] = useState(true);

  const key = useMemo(() => {
    // Per-user storage key, so each user gets their own first-time boot
    return user?.uid ? `bootSeen:${user.uid}` : "bootSeen:guest";
  }, [user?.uid]);

  const isFirstTime = useMemo(() => {
    if (!user?.uid) return false;
    return localStorage.getItem(key) !== "1";
  }, [key, user?.uid]);

  useEffect(() => {
    // On mount, show boot every time user enters the app while logged in
    // If you want “only first time ever”, set showBoot(false) when already seen.
    setShowBoot(true);
  }, [user?.uid]);

  const finish = () => {
    if (user?.uid) localStorage.setItem(key, "1");
    setShowBoot(false);
  };

  if (showBoot) {
    return (
      <BootScreen
        isFirstTime={isFirstTime}
        durationMs={isFirstTime ? 3600 : 2200}
        onDone={finish}
      />
    );
  }

  return <>{children}</>;
}
