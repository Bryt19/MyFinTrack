import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

type NotificationType = "success" | "error";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

// Toast Component
const NotificationToast = ({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: (id: string) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 3500); // Auto close after 3.5 seconds
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      layout
      className={`pointer-events-auto flex w-full max-w-[calc(100vw-2rem)] sm:max-w-xs items-start sm:items-center gap-2 sm:gap-3 rounded-lg border p-3 sm:p-4 shadow-lg ring-1 ring-black/5 ${
        notification.type === "success"
          ? "bg-white dark:bg-zinc-900 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200"
          : "bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200"
      }`}
    >
      {notification.type === "success" ? (
        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-green-500 dark:text-green-400 mt-0.5 sm:mt-0" />
      ) : (
        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-500 dark:text-red-400 mt-0.5 sm:mt-0" />
      )}
      <p className="flex-1 text-xs sm:text-sm font-medium leading-5 sm:leading-none">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="shrink-0 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

const PREF_STORAGE_KEY = "myfintrack_prefs";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, message: string) => {
      // Check preferences
      try {
        const prefs = JSON.parse(
          localStorage.getItem(PREF_STORAGE_KEY) ?? "{}"
        );
        // Default to true if not set? Or false? 
        // User requested toggle "There should be an option... to enable". 
        // Usually defaults to enabled. Let's assume enabled unless explicitly disabled (if toggle exists).
        // But for "system notification", maybe consistent per user request.
        // Assuming if pref is undefined, we show it (opt-out).
        const enabled = prefs.enableNotifications !== false; // Default true
        
        // Critical errors might always show? User said "enable system notification... like new budget added".
        // Errors "wrong credentials" usually show anyway. 
        // I will force Show errors always? Or respect toggle?
        // User: "When signing in... if wrong credentials, it should say... error". This is UI feedback, not just "system notification".
        // But "system notification... like new budget added". This implies the toggle is for "success/info" notifications.
        // I'll make errors ALWAYS show (UI feedback), success messages depend on preference.
        
        if (type === "success" && !enabled) return;
        
      } catch (e) {
        // ignore
      }

      const id = Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => [...prev, { id, type, message }]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string) => addNotification("success", message),
    [addNotification]
  );

  const showError = useCallback(
    (message: string) => addNotification("error", message),
    [addNotification]
  );

  return (
    <NotificationContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-[calc(100vw-2rem)] sm:max-w-xs items-end sm:top-6 sm:right-6">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
