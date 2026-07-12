import React, { createContext, useContext, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, XCircle, ShieldAlert, HelpCircle } from 'lucide-react';

interface DialogState {
  isOpen: boolean;
  type: 'info' | 'success' | 'warning' | 'danger' | 'prompt';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  resolver: (value: any) => void;
}

interface DialogContextType {
  showAlert: (message: string, title?: string, type?: 'info' | 'success' | 'warning' | 'danger') => Promise<void>;
  showConfirm: (message: string, title?: string, type?: 'info' | 'success' | 'warning' | 'danger', confirmText?: string, cancelText?: string) => Promise<boolean>;
  showPrompt: (message: string, title?: string, placeholder?: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const showAlert = (
    message: string,
    title = 'Informasi',
    type: 'info' | 'success' | 'warning' | 'danger' = 'info'
  ): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type,
        title,
        message,
        confirmText: 'Selesai',
        resolver: resolve,
      });
    });
  };

  const showConfirm = (
    message: string,
    title = 'Konfirmasi Tindakan',
    type: 'info' | 'success' | 'warning' | 'danger' = 'warning',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        resolver: resolve,
      });
    });
  };

  const showPrompt = (
    message: string,
    title = 'Masukan Diperlukan',
    placeholder = 'Ketik di sini...',
    defaultValue = ''
  ): Promise<string | null> => {
    setInputValue(defaultValue);
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        placeholder,
        defaultValue,
        confirmText: 'Kirim',
        cancelText: 'Batal',
        resolver: resolve,
      });
      // Focus input after modal renders
      setTimeout(() => inputRef.current?.focus(), 100);
    });
  };

  const handleConfirm = () => {
    if (!dialog) return;
    const resolver = dialog.resolver;
    if (dialog.type === 'prompt') {
      resolver(inputValue);
    } else {
      resolver(true);
    }
    setDialog(null);
    setInputValue('');
  };

  const handleCancel = () => {
    if (!dialog) return;
    const resolver = dialog.resolver;
    if (dialog.type === 'prompt') {
      resolver(null);
    } else {
      resolver(false);
    }
    setDialog(null);
    setInputValue('');
  };

  const getIcon = () => {
    if (!dialog) return null;
    switch (dialog.type) {
      case 'success':
        return <CheckCircle2 className="w-10 h-10 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-10 h-10 text-amber-400" />;
      case 'danger':
        return <ShieldAlert className="w-10 h-10 text-rose-500" />;
      case 'prompt':
        return <HelpCircle className="w-10 h-10 text-blue-400" />;
      default:
        return <Info className="w-10 h-10 text-blue-400" />;
    }
  };

  const getHeaderColor = () => {
    if (!dialog) return '';
    switch (dialog.type) {
      case 'success':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'danger':
        return 'text-rose-400';
      case 'prompt':
        return 'text-blue-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dialog.cancelText ? handleCancel : undefined}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              id="dialog-overlay"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#161b22] border border-slate-850 rounded-3xl overflow-hidden shadow-2xl z-10"
              id="dialog-card"
            >
              {/* Header Visual Stripe */}
              <div className={`h-1.5 w-full ${
                dialog.type === 'success' ? 'bg-emerald-500' :
                dialog.type === 'warning' ? 'bg-amber-500' :
                dialog.type === 'danger' ? 'bg-rose-500' :
                'bg-blue-500'
              }`} />

              <div className="p-6 space-y-4">
                {/* Icon & Title Group */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 p-1 bg-slate-900/40 rounded-2xl border border-slate-800">
                    {getIcon()}
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-sm font-extrabold uppercase font-mono tracking-wider ${getHeaderColor()}`} id="dialog-title">
                      {dialog.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-wrap" id="dialog-message">
                      {dialog.message}
                    </p>
                  </div>
                </div>

                {/* Prompt Input Field */}
                {dialog.type === 'prompt' && (
                  <div className="pt-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirm();
                        if (e.key === 'Escape') handleCancel();
                      }}
                      placeholder={dialog.placeholder}
                      className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 tracking-wider font-semibold shadow-inner"
                      id="dialog-prompt-input"
                    />
                  </div>
                )}

                {/* Interactive Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  {dialog.cancelText && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2.5 bg-[#0f1219] border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-2xl text-xs transition active:scale-95 cursor-pointer min-h-[44px] min-w-[80px]"
                      id="dialog-cancel-btn"
                    >
                      {dialog.cancelText}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className={`px-5 py-2.5 font-bold rounded-2xl text-xs transition active:scale-95 cursor-pointer shadow-md min-h-[44px] min-w-[80px] ${
                      dialog.type === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : dialog.type === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : dialog.type === 'success'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                    id="dialog-confirm-btn"
                  >
                    {dialog.confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
