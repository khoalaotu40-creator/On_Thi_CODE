import { useState, useEffect } from 'react';
import { X, Save, Key, Layout } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: string, modelId: string) => void;
  initialProvider: string;
  initialModelId: string;
}

export function SettingsModal({ isOpen, onClose, onSave, initialProvider, initialModelId }: SettingsModalProps) {
  const [provider, setProvider] = useState(initialProvider);
  const [modelId, setModelId] = useState(initialModelId);

  useEffect(() => {
    if (isOpen) {
      setProvider(initialProvider);
      setModelId(initialModelId);
    }
  }, [isOpen, initialProvider, initialModelId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-outline/20 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface">
          <h2 className="text-lg font-semibold text-on-surface">Cài đặt Hệ thống</h2>
          <button 
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-on-surface flex items-center gap-2">
              <Layout size={18} className="text-primary" />
              Nhà cung cấp (API Provider)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  provider === 'gemini' 
                    ? 'border-primary bg-primary-container text-on-primary-container' 
                    : 'border-outline-variant bg-surface hover:bg-surface-container-high text-on-surface'
                }`}
              >
                Google Gemini API
              </button>
              <button
                type="button"
                onClick={() => setProvider('openrouter')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  provider === 'openrouter' 
                    ? 'border-primary bg-primary-container text-on-primary-container' 
                    : 'border-outline-variant bg-surface hover:bg-surface-container-high text-on-surface'
                }`}
              >
                OpenRouter
              </button>
            </div>
          </div>

          {provider === 'openrouter' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-medium text-on-surface flex items-center gap-2">
                <Key size={18} className="text-primary" />
                Model ID (OpenRouter)
              </label>
              <input
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="VD: meta-llama/llama-3-8b-instruct"
                className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Khi sử dụng OpenRouter, hãy đảm bảo bạn đã cấu hình <code>OPENROUTER_API_KEY</code> trong môi trường (environment).
              </p>
            </div>
          )}

          {provider === 'gemini' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container p-3 rounded-lg border border-outline-variant">
                Sử dụng API cục bộ từ Google Gemini thông qua biến môi trường <code>GEMINI_API_KEY</code>. Model mặc định là <b>gemini-2.5-flash</b>.
              </p>
            </div>
          )}

        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onSave(provider, modelId)}
            className="px-5 py-2 text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save size={18} />
            Lưu cài đặt
          </button>
        </div>

      </div>
    </div>
  );
}
