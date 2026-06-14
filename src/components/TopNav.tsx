import { Bell, HelpCircle, LogOut, User, Settings, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopNavProps {
  activeTab: 'editor' | 'batch';
  onTabChange: (tab: 'editor' | 'batch') => void;
  currentUser: string | null;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export function TopNav({ activeTab, onTabChange, currentUser, onLogout, onOpenSettings }: TopNavProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center w-full px-6 h-16 max-w-[1280px] mx-auto bg-surface border-b border-outline-variant sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-primary tracking-tight">Quiz Processor</span>
        <div className="hidden md:flex items-center gap-4 ml-10">
          <button 
            onClick={() => onTabChange('editor')}
            className={`text-sm font-medium transition-all duration-200 py-1 ${activeTab === 'editor' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary border-b-2 border-transparent'}`}
          >
            Trình biên tập
          </button>
          <button 
            onClick={() => onTabChange('batch')}
            className={`text-sm font-medium transition-all duration-200 py-1 ${activeTab === 'batch' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary border-b-2 border-transparent'}`}
          >
            Xử lý hàng loạt
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-full border border-outline-variant"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold uppercase cursor-pointer">
                {currentUser.charAt(0)}
              </div>
              <span className="text-sm font-medium text-on-surface">{currentUser}</span>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-outline-variant rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-outline-variant mb-2 bg-surface-container-lowest">
                  <p className="text-sm font-semibold text-on-surface truncate">{currentUser}</p>
                  <p className="text-xs text-on-surface-variant">Thành viên</p>
                </div>
                
                <button className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors">
                  <Info size={16} className="text-on-surface-variant" />
                  Thông tin cá nhân
                </button>
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                >
                  <Settings size={16} className="text-on-surface-variant" />
                  Cài đặt
                </button>
                
                <div className="h-px bg-outline-variant my-2"></div>
                
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/20 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
