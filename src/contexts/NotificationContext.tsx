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
      className={`pointer-events-auto flex w-full max-w-[calc(100vw-2rem)] sm:max-w-xs items-start sm:items-center gap-2 sm:gap-3 rounded-lg border-l-4 p-2.5 sm:p-4 shadow-2xl ring-1 ring-black/5 ${
        notification.type === "success"
          ? "bg-white dark:bg-zinc-900 border-emerald-500 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300"
          : "bg-white dark:bg-zinc-900 border-rose-500 dark:border-rose-500 text-rose-700 dark:text-rose-300"
      }`}
    >
      {notification.type === "success" ? (
        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5 sm:mt-0" />
      ) : (
        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5 sm:mt-0" />
      )}
      <p className="flex-1 text-[11px] sm:text-sm font-semibold sm:font-medium leading-4 sm:leading-none">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--text-muted)] dark:text-white" />
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
       
        const enabled = prefs.enableNotifications !== false; // Default true
        
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
