import { useState, useEffect } from "react";
import { AlertTriangle, LucideIcon } from "lucide-react";
import { toast } from "sonner";

export type NotificationItem = {
  id: string;
  Icon: LucideIcon;
  color: string;
  text: string;
  time: string;
  link?: string;
};

let globalNotifications: NotificationItem[] = [];
const listeners = new Set<() => void>();

export function addNotification(n: Omit<NotificationItem, "id" | "time">) {
  const newNotif = {
    ...n,
    id: Math.random().toString(36).slice(2, 9),
    time: "Just now",
  };
  globalNotifications = [newNotif, ...globalNotifications];
  listeners.forEach(l => l());
  
  toast.error(n.text, {
    duration: 5000,
    onClick: n.link ? () => { window.location.href = n.link!; } : undefined,
    action: n.link ? { label: "View", onClick: () => { window.location.href = n.link!; } } : undefined
  });
}

export function useNotifications() {
  const [notifs, setNotifs] = useState(globalNotifications);
  
  useEffect(() => {
    const l = () => setNotifs([...globalNotifications]);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  
  return notifs;
}
