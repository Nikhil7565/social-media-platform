import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface XPToastProps {
  amount: number;
  label?: string;
  onDone: () => void;
}

export const XPToast = ({ amount, label = 'XP Earned!', onDone }: XPToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`fixed bottom-8 right-8 z-[9999] transition-all duration-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-[0_0_30px_rgba(124,58,237,0.5)] border border-white/20 backdrop-blur-xl">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <div className="text-white font-black text-lg leading-tight">+{amount} XP</div>
          <div className="text-white/70 text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
};

// Global XP Toast manager
type ToastEntry = { id: number; amount: number; label: string };
let listeners: ((toasts: ToastEntry[]) => void)[] = [];
let toasts: ToastEntry[] = [];
let nextId = 0;

export const showXPToast = (amount: number, label?: string) => {
  const entry = { id: nextId++, amount, label: label || 'XP Earned!' };
  toasts = [...toasts, entry];
  listeners.forEach(l => l(toasts));
};

export const XPToastContainer = () => {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  useEffect(() => {
    const listener = (t: ToastEntry[]) => setEntries([...t]);
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }, []);

  const remove = (id: number) => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l(toasts));
  };

  // Stack them
  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {entries.map((e) => (
        <XPToast key={e.id} amount={e.amount} label={e.label} onDone={() => remove(e.id)} />
      ))}
    </div>
  );
};
