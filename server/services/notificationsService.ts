export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  category: "system" | "chat" | "files" | "studio" | "security" | "usage" | "sms";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority?: "low" | "normal" | "high";
}

let notificationsStore: AppNotification[] = [
  {
    id: "notif-1",
    title: "Welcome to MKUU AI",
    message: "Your modular AI workspace is live and ready. Explore chat, grounding, vision, and creative studio tools.",
    category: "system",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    priority: "normal",
  },
  {
    id: "notif-2",
    title: "Memory System Active",
    message: "Long-term preference tracking is initialized. You can inspect or clear memories at any time.",
    category: "system",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: true,
    priority: "low",
  },
  {
    id: "notif-3",
    title: "Security & Encryption",
    message: "All AI model keys remain strictly isolated on the backend server. Zero client exposure.",
    category: "security",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    read: true,
    priority: "high",
  }
];

export function getNotifications(): AppNotification[] {
  return [...notificationsStore];
}

export function markAsRead(id: string): boolean {
  const item = notificationsStore.find(n => n.id === id);
  if (item) {
    item.read = true;
    return true;
  }
  return false;
}

export function markAllAsRead(): void {
  notificationsStore.forEach(n => n.read = true);
}

export function clearNotifications(): void {
  notificationsStore = [];
}

export function pushNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">): AppNotification {
  const newNotif: AppNotification = {
    id: "notif-" + Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notif,
  };
  notificationsStore.unshift(newNotif);
  return newNotif;
}
