export type QuestionStatus = 'pending' | 'review' | 'processing' | 'completed';

export interface Question {
  id: string;
  sequence: string;
  title: string;
  content: string;
  mathContent?: string;
  tags: string[];
  status: QuestionStatus;
  aiAnalysis?: string;
  aiSteps?: React.ReactNode[];
  confidence?: number;
  lastModified?: string;
  solutionStepByStep?: string;
  isGeneratingSolution?: boolean;
}
