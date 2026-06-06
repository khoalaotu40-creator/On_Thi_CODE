/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { BatchOperations } from './components/BatchOperations';
import { mockQuestions } from './data';
import { parseMarkdownToQuestions } from './utils/textSplitter';
import { Question } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'batch'>('batch');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  
  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseMarkdownToQuestions(text);
    
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
  
  const handleMarkdownSubmit = (text: string) => {
    const parsed = parseMarkdownToQuestions(text);
    
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

    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, isGeneratingSolution: true, solutionStepByStep: '' } : q));

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
              setQuestions(prev => prev.map(question => question.id === questionId ? { ...question, isGeneratingSolution: false } : question));
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                 throw new Error(data.error);
              }
              if (data.text) {
                setQuestions(prev => prev.map(question => question.id === questionId ? { ...question, solutionStepByStep: (question.solutionStepByStep || '') + data.text } : question));
              }
            } catch (e) {
               // ignore
            }
          }
          nextNewline = buffer.indexOf('\n\n');
        }
      }
    } catch (e: any) {
      console.error(e);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, isGeneratingSolution: false, solutionStepByStep: `Lỗi khi gọi API: ${e.message || 'Lỗi không xác định'}` } : q));
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 overflow-hidden max-w-[1280px] w-full mx-auto border-x border-outline-variant shadow-sm">
        {activeTab === 'editor' ? (
          <>
            <Sidebar 
              questions={questions} 
              activeId={activeQuestionId} 
              onSelect={setActiveQuestionId} 
              onClearAll={() => { setQuestions([]); setActiveQuestionId(''); }}
            />
            <MainContent 
              question={activeQuestion} 
              onGenerateSolution={handleGenerateSolution} 
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

