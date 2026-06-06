import { useState, useRef, useEffect } from 'react';
import { Upload, Play, CheckCircle, Clock, Sparkles, Loader2, ArrowRight, Trash2, Copy, History, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [actionHistory, setActionHistory] = useState('');
  const [isActionHistoryOpen, setIsActionHistoryOpen] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  
  const endOfStreamRef = useRef<HTMLDivElement>(null);

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
    setActionHistory('');
    setIsActionHistoryOpen(true);

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
      let fullText = '';
      let isHistoryClosed = false;

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
              if (!isHistoryClosed) {
                setIsActionHistoryOpen(false);
              }
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                 throw new Error(data.error);
              }
              if (data.text) {
                fullText += data.text;
                
                if (!isHistoryClosed) {
                   const closeIdx = fullText.indexOf('</action_history>');
                   if (closeIdx !== -1) {
                      isHistoryClosed = true;
                      setIsActionHistoryOpen(false);
                      const startIdx = fullText.indexOf('<action_history>');
                      if (startIdx !== -1) {
                         setActionHistory(fullText.substring(startIdx + 16, closeIdx).trim());
                         setExtractedText(fullText.substring(closeIdx + 17).trimStart());
                      } else {
                         setExtractedText(fullText.substring(closeIdx + 17).trimStart());
                      }
                   } else {
                      const startIdx = fullText.indexOf('<action_history>');
                      if (startIdx !== -1) {
                         setActionHistory(fullText.substring(startIdx + 16));
                      }
                   }
                } else {
                   const closeIdx = fullText.indexOf('</action_history>');
                   if (closeIdx !== -1) {
                     setExtractedText(fullText.substring(closeIdx + 17).trimStart());
                   } else {
                     // Fallback if tags matched weirdly
                     setExtractedText(fullText);
                   }
                }
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
      </div>
      
      <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
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
              
              {(actionHistory || (isExtracting && isActionHistoryOpen)) && (
                <div className="border-b border-outline-variant bg-surface-container-lowest z-20">
                  <button 
                    onClick={() => setIsActionHistoryOpen(!isActionHistoryOpen)}
                    className="w-full flex items-center justify-between p-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History size={16} />
                      <span>Tiến trình xử lý (Action History)</span>
                    </div>
                    {isActionHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isActionHistoryOpen && actionHistory && (
                    <div className="p-4 text-xs font-mono text-on-surface-variant bg-surface-container-lowest whitespace-pre-wrap border-t border-outline-variant/50 max-h-48 overflow-y-auto custom-scrollbar">
                      {actionHistory}
                    </div>
                  )}
                  {isActionHistoryOpen && isExtracting && !actionHistory && (
                    <div className="p-4 text-xs font-mono text-on-surface-variant flex items-center gap-2 bg-surface-container-lowest border-t border-outline-variant/50">
                      <Loader2 size={12} className="animate-spin" /> Đang khởi tạo...
                    </div>
                  )}
                </div>
              )}
              
              {!isExtracting && !extractedText && !actionHistory && (
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
