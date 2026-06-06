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
      <div className="flex items-center gap-4">
        
        <div className="flex items-center gap-2 ml-2 mr-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full">
            <Bell size={20} />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full">
            <HelpCircle size={20} />
          </button>
        </div>
        <button className="bg-primary text-on-primary px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover active:scale-95 transition-all">
          Xuất tất cả
        </button>
        <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
          <img 
            alt="Administrator" 
            className="w-full h-full object-cover" 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
          />
        </div>
      </div>
    </header>
  );
}
