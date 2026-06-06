import { Question } from '../types';

export function parseMarkdownToQuestions(markdown: string): Omit<Question, 'id'>[] {
  // Regex to split by common question markers: "Câu 1", "Bài 1", "Question 1", etc.
  // Handles optional heading marks before it and does not strictly require a colon/dot afterwards.
  const questionRegex = /(?=(?:^|\n)\s*(?:#+\s*)?(?:Câu|Bài|Question)\s*\d+)/i;
  
  if (!questionRegex.test(markdown)) {
    // If no markers found, treat the entire file as a single question
    return [{
       sequence: '#001',
       title: 'Untitled Question',
       content: markdown,
       tags: ['Imported'],
       status: 'pending',
       lastModified: 'Just now'
    }];
  }

  const parts = markdown.split(questionRegex);
  
  return parts.filter(p => p.trim() !== '').map((part, index) => {
    const lines = part.trim().split('\n');
    let titleLine = lines[0].trim().replace(/^#+\s*/, ''); // Remove leading ##
    
    // Try to extract a clean title if it matches Câu X / Bài X
    const match = titleLine.match(/^(Câu|Bài|Question)\s*\d+/i);
    let displayTitle = titleLine;
    if (match) {
      displayTitle = match[0];
    } else if (titleLine.length > 50) {
      displayTitle = titleLine.substring(0, 50) + '...';
    }

    // Content is everything else. If no other content, use the title line
    const content = lines.join('\n').trim();

    // Extract math content (stuff inside $$...$$) for specific highlighting
    let mathContent = undefined;
    const mathMatch = content.match(/\$\$(.*?)\$\$/s);
    if (mathMatch) {
       mathContent = `$$${mathMatch[1]}$$`;
    }

    return {
      sequence: `#IMPT-${String(index + 1).padStart(3, '0')}`,
      title: displayTitle,
      content: content,
      mathContent: mathContent,
      tags: ['Imported'],
      status: 'pending', 
      lastModified: 'Just now'
    };
  });
}
