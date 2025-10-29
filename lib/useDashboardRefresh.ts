import { useEffect } from "react";
import { refreshBus } from "./refreshBus";

export function useDashboardRefresh(handler: () => void) {
  useEffect(() => {
    const h = () => handler();
    refreshBus.addEventListener("dashboard:refresh", h);
    return () => refreshBus.removeEventListener("dashboard:refresh", h);
  }, [handler]);
}
