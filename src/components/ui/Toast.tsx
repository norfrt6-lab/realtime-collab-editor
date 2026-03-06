"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  closing?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const colors: Record<ToastType, string> = {
  success: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20",
  error: "text-[var(--destructive)] bg-[var(--destructive)]/10 border-[var(--destructive)]/20",
  warning: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20",
  info: "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/20",
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-[var(--shadow-lg)] max-w-sm ${
              colors[t.type]
            } ${t.closing ? "animate-toast-out" : "animate-toast-in"}`}
          >
            <span className="shrink-0">{icons[t.type]}</span>
            <p className="text-sm font-medium text-[var(--foreground)] flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 rounded-full"
              style={{ animation: "progressShrink 4s linear forwards" }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
