import { FileText, Sparkles, Tag, Plus, Trash2, Command, Bot, Loader2, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Question } from '../types';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface MainContentProps {
  question: Question | undefined;
  onGenerateSolution?: (id: string) => void;
  onToggleSolutionActionHistory?: (id: string, isOpen: boolean) => void;
}

export function MainContent({ question, onGenerateSolution, onToggleSolutionActionHistory }: MainContentProps) {
  if (!question) {
    return (
      <main className="flex-1 flex flex-col bg-background h-full overflow-hidden items-center justify-center text-on-surface-variant">
        <Sparkles size={48} className="mb-4 text-outline-variant" />
        <p>Chọn một câu hỏi để xem chi tiết</p>
      </main>
    );
  }

  const isReviewStatus = question.status === 'review';

  return (
    <main className="flex-1 flex flex-col bg-background h-full overflow-hidden relative">
      {/* Detail Header */}
      <div className="px-8 py-6 bg-surface border-b border-outline-variant flex justify-between items-center z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center font-bold text-sm">
            {question.sequence}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-on-background tracking-tight">Chi tiết câu hỏi</h1>
            <p className="text-xs font-medium text-on-surface-variant mt-0.5">Cập nhật lần cuối: {question.lastModified}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isReviewStatus && (
            <span className="px-4 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-bold uppercase tracking-wider">
              Trạng thái: Cần review
            </span>
          )}
          {question.status === 'processing' && (
            <span className="px-4 py-1.5 rounded-full bg-warning-container text-on-warning-container text-xs font-bold uppercase tracking-wider">
              Trạng thái: Đang xử lý
            </span>
          )}
          {question.status === 'completed' && (
            <span className="px-4 py-1.5 rounded-full bg-success-container text-on-success-container text-xs font-bold uppercase tracking-wider">
              Trạng thái: Hoàn thành
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
        
        {/* Section 1: Question Content */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <FileText size={20} />
            <h3 className="text-sm font-semibold uppercase tracking-widest">Nội dung câu hỏi</h3>
          </div>
          
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="prose prose-indigo max-w-none">
              <div className="text-base text-on-surface leading-relaxed font-medium content-markdown">
                <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                  {question.content}
                </Markdown>
              </div>
              
              {question.mathContent && (
                <div className="math-block">
                  <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {question.mathContent}
                  </Markdown>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: AI Solution Step-by-Step */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Bot size={20} />
            <h3 className="text-sm font-semibold uppercase tracking-widest">Lời giải chi tiết</h3>
          </div>
          
          <div className={`bg-surface border-2 ${question.solutionStepByStep || question.solutionActionHistory ? 'border-primary-container/60' : 'border-dashed border-outline-variant p-8 text-center'} rounded-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden w-full`}>
            {(!question.solutionStepByStep && !question.solutionActionHistory && !question.isGeneratingSolution) && (
              <>
                <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center text-primary mb-2 shadow-sm">
                  <Sparkles size={32} />
                </div>
                <div>
                  <p className="text-on-surface font-semibold mb-1">Chưa có lời giải</p>
                  <p className="text-sm text-on-surface-variant max-w-md">Dùng sức mạnh của AI để tạo hướng dẫn giải bài toán này từng bước một.</p>
                </div>
                <button 
                  onClick={() => onGenerateSolution && onGenerateSolution(question.id)}
                  className="mt-2 text-on-primary bg-primary px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-hover active:scale-95 transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Làm từng bước với AI</span>
                </button>
              </>
            )}

            {(question.solutionActionHistory || (question.isGeneratingSolution && question.isSolutionActionHistoryOpen)) ? (
              <div className="w-full border-b border-outline-variant bg-surface-container-lowest z-20">
                <button 
                  onClick={() => onToggleSolutionActionHistory && onToggleSolutionActionHistory(question.id, !question.isSolutionActionHistoryOpen)}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History size={16} />
                    <span>Tiến trình giải (Action History)</span>
                  </div>
                  {question.isSolutionActionHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {question.isSolutionActionHistoryOpen && question.solutionActionHistory && (
                  <div className="p-4 text-xs font-mono text-on-surface-variant bg-surface-container-lowest whitespace-pre-wrap border-t border-outline-variant/50 max-h-48 overflow-y-auto custom-scrollbar text-left w-full">
                    {question.solutionActionHistory}
                  </div>
                )}
                {question.isSolutionActionHistoryOpen && question.isGeneratingSolution && !question.solutionActionHistory && (
                  <div className="p-4 text-xs font-mono text-on-surface-variant flex items-center gap-2 bg-surface-container-lowest border-t border-outline-variant/50 text-left w-full">
                    <Loader2 size={12} className="animate-spin" /> Đang khởi tạo suy luận...
                  </div>
                )}
              </div>
            ) : null}

            {question.isGeneratingSolution && !question.solutionStepByStep && !question.solutionActionHistory && !question.isSolutionActionHistoryOpen && (
               <div className="flex flex-col items-center justify-center p-8 gap-4 text-primary w-full">
                 <Loader2 size={32} className="animate-spin" />
                 <span className="font-medium">AI đang phân tích và giải từng bước...</span>
               </div>
            )}
            
            {(question.solutionStepByStep || (question.isGeneratingSolution && question.solutionStepByStep)) ? (
              <div className="w-full text-left p-6">
                <div className="prose prose-indigo max-w-none text-base text-on-surface leading-relaxed content-markdown">
                  <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {question.solutionStepByStep || ''}
                  </Markdown>
                </div>
                {question.isGeneratingSolution && (
                  <div className="flex items-center gap-2 text-primary mt-4 text-sm font-medium">
                    <Loader2 size={16} className="animate-spin" />
                    Đang viết tiếp lời giải...
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>

        {/* Metadata Chips */}
        <section className="flex flex-wrap gap-4 pt-8 border-t border-outline-variant">
          {question.tags.map(tag => (
             <div key={tag} className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant hover:border-primary transition-colors cursor-pointer group shadow-sm">
               <Tag size={16} className="text-outline group-hover:text-primary transition-colors" />
               <span className="text-xs font-semibold tracking-wide">{tag}</span>
             </div>
          ))}
          <button className="flex items-center justify-center w-8 h-8 mt-0.5 rounded-full border border-dashed border-outline hover:border-primary hover:text-primary transition-all">
            <Plus size={16} />
          </button>
        </section>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-5 bg-surface border-t border-outline-variant flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-error transition-colors px-3 py-2 font-medium bg-transparent rounded hover:bg-error-container/20">
            <Trash2 size={18} />
            <span className="text-sm">Xóa</span>
          </button>
        </div>
      </div>
      
      {/* Floating UI decoration */}
      <div className="absolute bottom-24 right-8 p-1.5 bg-surface border border-outline-variant shadow-lg rounded-full flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300 z-50">
        <Command size={16} className="text-primary ml-2" />
        <span className="text-xs font-semibold pr-3 text-on-surface-variant">Cmd + S để lưu</span>
      </div>
    </main>
  );
}
