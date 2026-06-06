/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { BatchOperations } from './components/BatchOperations';
import { Auth } from './components/Auth';
import { mockQuestions } from './data';
import { parseMarkdownToQuestions } from './utils/textSplitter';
import { Question } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('currentUser'));
  const [activeTab, setActiveTab] = useState<'editor' | 'batch'>('editor');
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(mockQuestions[0]?.id || '');
  
  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  const handleLogin = (username: string) => {
    localStorage.setItem('currentUser', username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const documentName = file.name;
    const parsed = parseMarkdownToQuestions(text, documentName);
    
    const newQuestions: Question[] = parsed.map((p, i) => ({
      ...p,
      id: `imported-${Date.now()}-${i}`
    }));

    setQuestions(prev => [...newQuestions, ...prev]);
    if (newQuestions.length > 0) {
      setActiveQuestionId(newQuestions[0].id);
    }
    
    e.target.value = '';
  };
  
  const handleMarkdownSubmit = (text: string, documentName: string = 'Đề Import Từ Text') => {
    const parsed = parseMarkdownToQuestions(text, documentName);
    
    const newQuestions: Question[] = parsed.map((p, i) => ({
      ...p,
      id: `imported-${Date.now()}-${i}`
    }));

    setQuestions(prev => [...newQuestions, ...prev]);
    if (newQuestions.length > 0) {
      setActiveQuestionId(newQuestions[0].id);
      setActiveTab('editor'); // automatically switch to editor once extracted
    }
  };

  const handleGenerateSolution = async (questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;

    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, isGeneratingSolution: true, solutionStepByStep: '', rateLimitLogs: [] } : q));

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ content: q.content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
      }

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let isHistoryClosed = false;
      const startTime = performance.now();

      // Ensure init open
      setQuestions(prev => prev.map(q => q.id === questionId ? { 
        ...q, 
        isSolutionActionHistoryOpen: true,
        solutionActionHistoryTimeMs: undefined 
      } : q));

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
              setQuestions(prev => prev.map(question => {
                if (question.id === questionId) {
                  return {
                    ...question,
                    isGeneratingSolution: false,
                    isSolutionActionHistoryOpen: isHistoryClosed ? question.isSolutionActionHistoryOpen : false
                  };
                }
                return question;
              }));
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                 throw new Error(data.error);
              }
              if (data.rateLimit) {
                 setQuestions(prev => prev.map(question => {
                    if (question.id !== questionId) return question;
                    const log = `[Rate Limit 429] Quá hạn mức. Đang đợi thử lại (Lần ${data.rateLimit.attempt}/${data.rateLimit.maxRetries}). Đợi thêm ${Math.round(data.rateLimit.delayMs / 1000)} giây...`;
                    return {
                      ...question,
                      rateLimitLogs: [...(question.rateLimitLogs || []), log]
                    };
                 }));
                 continue;
              }
              if (data.text) {
                fullText += data.text;
                setQuestions(prev => prev.map(question => {
                  if (question.id !== questionId) return question;
                  
                  let newActionHistory = question.solutionActionHistory || '';
                  let newExtracted = question.solutionStepByStep || '';
                  let openState = question.isSolutionActionHistoryOpen ?? true;
                  let timeMs = question.solutionActionHistoryTimeMs;
                  
                  if (!isHistoryClosed) {
                    const closeIdx = fullText.indexOf('</action_history>');
                    if (closeIdx !== -1) {
                      isHistoryClosed = true;
                      openState = false;
                      timeMs = performance.now() - startTime;
                      const startIdx = fullText.indexOf('<action_history>');
                      if (startIdx !== -1) {
                        newActionHistory = fullText.substring(startIdx + 16, closeIdx).trim();
                        newExtracted = fullText.substring(closeIdx + 17).trimStart();
                      } else {
                        newExtracted = fullText.substring(closeIdx + 17).trimStart();
                      }
                    } else {
                      const startIdx = fullText.indexOf('<action_history>');
                      if (startIdx !== -1) {
                        newActionHistory = fullText.substring(startIdx + 16);
                      }
                    }
                  } else {
                    const closeIdx = fullText.indexOf('</action_history>');
                    if (closeIdx !== -1) {
                      newExtracted = fullText.substring(closeIdx + 17).trimStart();
                    } else {
                      newExtracted = fullText;
                    }
                  }
                  
                  return {
                    ...question,
                    solutionActionHistory: newActionHistory,
                    solutionStepByStep: newExtracted,
                    isSolutionActionHistoryOpen: openState,
                    solutionActionHistoryTimeMs: timeMs
                  };
                }));
              }
            } catch (e: any) {
               if (e instanceof SyntaxError) {
                 // ignore incomplete chunk
               } else {
                 throw e;
               }
            }
          }
          nextNewline = buffer.indexOf('\n\n');
        }
      }
    } catch (e: any) {
      console.error(e);
      setQuestions(prev => prev.map(q => {
        if (q.id !== questionId) return q;
        const isLimitError = e.message?.includes("hạn mức");
        return {
          ...q,
          isGeneratingSolution: false,
          solutionStepByStep: isLimitError ? q.solutionStepByStep : `Lỗi khi gọi API: ${e.message || 'Lỗi không xác định'}`,
          rateLimitLogs: isLimitError ? [...(q.rateLimitLogs || []), `[Lỗi Nghiêm Trọng] ${e.message}`] : q.rateLimitLogs,
          isSolutionActionHistoryOpen: isLimitError ? true : q.isSolutionActionHistoryOpen
        };
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 overflow-hidden max-w-[1280px] w-full mx-auto border-x border-outline-variant shadow-sm">
        {activeTab === 'editor' ? (
          <>
            <Sidebar 
              questions={questions} 
              activeId={activeQuestionId} 
              onSelect={setActiveQuestionId} 
              onClearAll={() => { setQuestions([]); setActiveQuestionId(''); }}
              onUpdateDocumentName={(oldName, newName) => {
                setQuestions(prev => prev.map(q => 
                  (q.documentName === oldName || (!q.documentName && oldName === 'Khác')) 
                    ? { ...q, documentName: newName } 
                    : q
                ));
              }}
            />
            <MainContent 
              question={activeQuestion} 
              onGenerateSolution={handleGenerateSolution} 
              onToggleSolutionActionHistory={(id, isOpen) => {
                setQuestions(prev => prev.map(q => q.id === id ? { ...q, isSolutionActionHistoryOpen: isOpen } : q));
              }}
              onUpdateQuestionContent={(id, content) => {
                setQuestions(prev => prev.map(q => q.id === id ? { ...q, content } : q));
              }}
            />
          </>
        ) : (
          <BatchOperations 
            questions={questions} 
            onUpload={handleFileUpload} 
            onGenerateAll={() => {}}
            onSubmitMarkdown={handleMarkdownSubmit}
          />
        )}
      </div>
    </div>
  );
}

