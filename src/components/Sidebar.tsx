import { Search, AlertCircle, Loader2, CheckCircle2, PanelLeftClose, PanelLeftOpen, Clock, Trash2 } from 'lucide-react';
import { Question, QuestionStatus } from '../types';
import { useState } from 'react';

interface SidebarProps {
  questions: Question[];
  activeId: string;
  onSelect: (id: string) => void;
  onClearAll: () => void;
}

const StatusBadge = ({ status }: { status: QuestionStatus }) => {
  switch (status) {
    case 'pending':
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-bold tracking-wide">
          <Clock size={12} />
          <span className="uppercase">Chưa xử lý</span>
        </div>
      );
    case 'review':
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold tracking-wide">
          <AlertCircle size={12} />
          <span className="uppercase">Cần review</span>
        </div>
      );
    case 'processing':
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-container text-on-warning-container text-[11px] font-bold tracking-wide">
          <Loader2 size={12} className="animate-spin" />
          <span className="uppercase">Đang xử lý</span>
        </div>
      );
    case 'completed':
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[11px] font-bold tracking-wide">
          <CheckCircle2 size={12} />
          <span className="uppercase">Hoàn thành</span>
        </div>
      );
  }
};

export function Sidebar({ questions, activeId, onSelect, onClearAll }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`transition-all duration-300 ease-in-out flex flex-col bg-surface-container-low border-r border-outline-variant h-full overflow-hidden shrink-0 ${isCollapsed ? 'w-16 min-w-[64px]' : 'w-[35%] min-w-[320px]'}`}>
      <div className={`border-b border-outline-variant ${isCollapsed ? 'p-4 flex justify-center' : 'p-6'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-on-surface tracking-tight whitespace-nowrap">Danh sách câu hỏi</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-on-surface-variant bg-surface-container px-2 py-1 rounded whitespace-nowrap">
                  {questions.length} mục
                </span>
                <button 
                  onClick={onClearAll} 
                  disabled={questions.length === 0}
                  className="p-1 hover:bg-error-container hover:text-error rounded text-on-surface-variant transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant" 
                  title="Xóa tất cả"
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant transition-colors" title="Thu gọn">
                  <PanelLeftClose size={18} />
                </button>
              </div>
            </div>
            
            <div className="relative group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all placeholder:text-outline" 
                placeholder="Tìm kiếm câu hỏi..." 
                type="text" 
              />
            </div>
          </>
        ) : (
          <button onClick={() => setIsCollapsed(false)} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant transition-colors group" title="Mở rộng">
            <PanelLeftOpen size={20} className="group-hover:text-primary transition-colors" />
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? 'p-3 space-y-3' : 'p-4 space-y-3'}`}>
        {questions.map((q, idx) => {
          const isActive = q.id === activeId;
          
          if (isCollapsed) {
            return (
              <div 
                key={q.id}
                onClick={() => onSelect(q.id)}
                title={q.title}
                className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-surface-container-lowest border-2 border-primary shadow-sm' 
                    : 'bg-surface-container-lowest border border-outline-variant hover:border-primary-container'
                }`}
              >
                {q.status === 'pending' && <Clock size={20} className={isActive ? 'text-primary' : 'text-on-surface-variant'} />}
                {q.status === 'review' && <AlertCircle size={20} className={isActive ? 'text-error' : 'text-on-surface-variant'} />}
                {q.status === 'processing' && <Loader2 size={20} className={`animate-spin ${isActive ? 'text-warning' : 'text-on-surface-variant'}`} />}
                {q.status === 'completed' && <CheckCircle2 size={20} className={isActive ? 'text-success' : 'text-on-surface-variant'} />}
              </div>
            );
          }

          return (
            <div 
              key={q.id}
              onClick={() => onSelect(q.id)}
              className={`rounded-xl p-4 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-surface-container-lowest border-2 border-primary shadow-sm active:scale-95' 
                  : 'bg-surface-container-lowest border border-outline-variant hover:border-primary-container'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {q.sequence}
                </span>
                <StatusBadge status={q.status} />
              </div>
              <p className="text-sm text-on-surface font-medium line-clamp-2 mb-3 leading-relaxed">
                {q.title}
              </p>
              <div className="flex gap-2 flex-wrap">
                {q.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-surface-container rounded md:text-[11px] text-[10px] font-medium text-on-surface-variant tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
