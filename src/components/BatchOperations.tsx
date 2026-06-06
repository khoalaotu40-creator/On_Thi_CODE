import { useState, useRef, useEffect } from 'react';
import { Upload, Play, CheckCircle, Clock, Sparkles, Loader2, ArrowRight, Trash2, Copy } from 'lucide-react';
import { Question } from '../types';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface BatchOperationsProps {
  questions: Question[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateAll: () => void;
  onSubmitMarkdown: (text: string) => void;
}

export function BatchOperations({ questions, onUpload, onGenerateAll, onSubmitMarkdown }: BatchOperationsProps) {
  const [markdownInput, setMarkdownInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [extractionComplete, setExtractionComplete] = useState(false);
  
  const endOfStreamRef = useRef<HTMLDivElement>(null);

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const processingCount = questions.filter(q => q.status === 'processing').length;
  const completedCount = questions.filter(q => q.status === 'completed').length;
  const reviewCount = questions.filter(q => q.status === 'review').length;

  useEffect(() => {
    if (isExtracting && endOfStreamRef.current) {
      endOfStreamRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [extractedText, isExtracting]);

  const handleAIExtract = async () => {
    if (!markdownInput.trim()) return;
    setIsExtracting(true);
    setExtractionComplete(false);
    setExtractedText('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ content: markdownInput }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi gọi API');
      }

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let nextNewline = buffer.indexOf('\n\n');
        
        while (nextNewline !== -1) {
          const chunk = buffer.slice(0, nextNewline);
          buffer = buffer.slice(nextNewline + 2);
          
          if (chunk.startsWith('data: ')) {
            const dataStr = chunk.slice(6);
            if (dataStr === '[DONE]') {
              setIsExtracting(false);
              setExtractionComplete(true);
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                 throw new Error(data.error);
              }
              if (data.text) {
                setExtractedText(prev => prev + data.text);
              }
            } catch (e) {
               // Only ignore JSON parse error
            }
          }
          nextNewline = buffer.indexOf('\n\n');
        }
      }
    } catch (e) {
      console.error(e);
      setIsExtracting(false);
      setExtractedText(prev => prev + '\n\n**Lỗi trong quá trình trích xuất.**');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      <div className="px-8 py-6 bg-surface border-b border-outline-variant flex flex-col sm:flex-row sm:justify-between sm:items-center z-10 shadow-sm shrink-0 gap-4">
        <div>
          <h1 className="text-lg font-semibold text-on-background tracking-tight">Xử lý hàng loạt</h1>
          <p className="text-sm text-on-surface-variant">Trích xuất câu hỏi từ văn bản và quản lý tiến trình.</p>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant text-on-surface px-5 py-2.5 rounded-lg text-sm font-semibold hover:border-primary cursor-pointer transition-all active:scale-95 shadow-sm">
            <Upload size={18} className="text-primary" />
            <span>Tải lên file .md</span>
            <input type="file" accept=".md" className="hidden" onChange={onUpload} />
          </label>
          <button 
            onClick={onGenerateAll}
            disabled={pendingCount === 0}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Play size={18} className="fill-white/20" />
            <span>Tạo AI tự động ({pendingCount})</span>
          </button>
        </div>
      </div>
      
      <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface-variant mb-1">Chờ xử lý</p>
              <p className="text-3xl font-bold text-on-surface">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning-container/50 flex items-center justify-center text-warning">
              <Clock size={24} className="text-on-warning-container" />
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface-variant mb-1">Cần review</p>
              <p className="text-3xl font-bold text-on-surface">{reviewCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-error-container/50 flex items-center justify-center">
              <span className="text-2xl font-bold text-on-error-container">!</span>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface-variant mb-1">Hoàn thành</p>
              <p className="text-3xl font-bold text-on-surface">{completedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success-container/50 flex items-center justify-center">
              <CheckCircle size={24} className="text-on-success-container" />
            </div>
          </div>
        </div>
        
        {/* Input and AI Output Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          {/* Left: Input Textarea */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
             <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="font-semibold text-sm">Nhập văn bản thô</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMarkdownInput('')}
                disabled={!markdownInput.trim()}
                className="flex items-center justify-center p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error disabled:opacity-50 transition-colors"
                title="Xóa nội dung"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => onSubmitMarkdown(markdownInput)}
                disabled={!markdownInput.trim() || isExtracting}
                className="flex items-center gap-2 bg-surface-container-high text-on-surface px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-highest disabled:opacity-50 transition-all border border-outline-variant"
                title="Trích xuất trực tiếp không qua AI"
              >
                <span>Trích xuất trực tiếp</span>
              </button>
              <button 
                onClick={handleAIExtract}
                disabled={!markdownInput.trim() || isExtracting}
                className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-all shadow-md shadow-primary/20"
              >
                {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Trích xuất AI</span>
              </button>
            </div>
             </div>
             <textarea 
               value={markdownInput}
               onChange={(e) => setMarkdownInput(e.target.value)}
               placeholder="Dán nội dung chuyên đề, bài kiểm tra vào đây... AI sẽ tự động nhận diện và trích xuất thành từng câu hỏi riêng biệt."
               className="flex-1 w-full p-6 text-sm focus:outline-none resize-none bg-surface-container-lowest border-0 custom-scrollbar text-on-surface"
             />
          </div>

          {/* Right: AI Streaming Output */}
          <div className="bg-surface border-2 border-primary-container/60 rounded-xl overflow-hidden flex flex-col shadow-sm relative">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={18} className="fill-primary/20" />
                <h3 className="font-semibold text-sm tracking-wide uppercase">Kết quả trích xuất</h3>
              </div>
              <div className="flex items-center gap-2">
                {extractedText && (
                  <button 
                    onClick={() => navigator.clipboard.writeText(extractedText)}
                    className="flex items-center gap-2 bg-surface border border-outline text-on-surface px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-surface-container-high transition-all outline-none"
                    title="Copy nội dung"
                  >
                    <Copy size={14} />
                    <span>Copy</span>
                  </button>
                )}
                {extractionComplete && (
                  <button 
                    onClick={() => onSubmitMarkdown(extractedText)}
                    className="flex items-center gap-2 bg-surface border border-outline text-on-surface px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-surface-container-high transition-all outline-none"
                  >
                    <ArrowRight size={14} />
                    <span>Chuyển sang Editor</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface relative flex flex-col p-0">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles size={180} />
              </div>
              
              {!isExtracting && !extractedText && (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant relative z-10 opacity-60 p-6">
                  <Sparkles size={48} className="mb-4 text-outline-variant" />
                  <p className="text-sm font-medium">AI sẽ phân tích và hiển thị kết quả tại đây.</p>
                </div>
              )}
              
              {(isExtracting || extractedText) && (
                 <textarea
                   className="flex-1 w-full h-full p-6 text-sm font-mono focus:outline-none resize-none bg-transparent border-0 custom-scrollbar text-on-surface relative z-10"
                   value={extractedText}
                   readOnly
                 />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
