import { Bell, HelpCircle } from 'lucide-react';

interface TopNavProps {
  activeTab: 'editor' | 'batch';
  onTabChange: (tab: 'editor' | 'batch') => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
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
    </header>
  );
}
