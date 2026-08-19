import { useCallback, useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { completeGoogleSession, getMe } from "./lib/api";
import type { MeResponse } from "./types/api";
import { LoadingScreen } from "./components/LoadingScreen";

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdminRoute = hash.startsWith("#/admin");

  const refreshMe = useCallback(async () => {
    try {
      const res = await getMe();
      setMe(res);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hash = window.location.hash;
        const ticket = hash.startsWith("#/auth/callback")
          ? new URLSearchParams(hash.split("?")[1] ?? "").get("ticket")
          : null;
        if (ticket) {
          try {
            const res = await completeGoogleSession(ticket);
            if (!cancelled) setMe(res);
          } finally {
            window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/`);
          }
          return;
        }

        const res = await getMe();
        if (!cancelled) setMe(res);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (me?.isAdmin && !isAdminRoute) {
      window.location.hash = "#/admin";
    }
  }, [me, isAdminRoute]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAdminRoute) {
    if (me?.isAdmin) {
      return <AdminDashboardPage me={me} />;
    }
    return <AdminLoginPage onLoggedIn={() => void refreshMe()} />;
  }

  if (me?.isAdmin) {
    return <AdminDashboardPage me={me} />;
  }

  return me ? <DashboardPage me={me} /> : <LoginPage />;
}
