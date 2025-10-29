export const refreshBus = new EventTarget();

export function emitDashboardRefresh() {
  refreshBus.dispatchEvent(new Event("dashboard:refresh"));
}
