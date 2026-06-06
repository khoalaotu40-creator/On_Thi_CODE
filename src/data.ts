import { Question } from './types';

export const mockQuestions: Question[] = [
  {
    id: '1',
    sequence: '#001',
    title: 'Câu 1: Giải phương trình bậc hai $x^2 - 5x + 6 = 0$ và tìm các nghiệm.',
    content: 'Giải phương trình bậc hai sau đây và liệt kê các bước giải chi tiết. Xác định các nghiệm thực nếu có.',
    mathContent: '$$x^2 - 5x + 6 = 0$$',
    tags: ['Toán học', 'Lớp 12'],
    documentName: 'Đề Toán học',
    status: 'review',
    confidence: 98.4,
    lastModified: '2 minutes ago',
    aiAnalysis: 'Để giải phương trình $x^2 - 5x + 6 = 0$, ta có thể sử dụng phương pháp phân tích thành nhân tử hoặc dùng công thức nghiệm.',
    aiSteps: [
      '**Bước 1:** Xác định các hệ số $a = 1$, $b = -5$, $c = 6$.',
      '**Bước 2:** Tính biệt thức $\\Delta$:',
      '$$\\Delta = b^2 - 4ac = (-5)^2 - 4(1)(6) = 25 - 24 = 1$$',
      '**Bước 3:** Vì $\\Delta > 0$, phương trình có hai nghiệm phân biệt:',
      '$$x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a} = \\frac{5 + 1}{2} = 3$$',
      '$$x_2 = \\frac{-b - \\sqrt{\\Delta}}{2a} = \\frac{5 - 1}{2} = 2$$',
      '**Kết luận:** Tập nghiệm của phương trình là $S = \\{2, 3\\}$.'
    ]
  },
  {
    id: '2',
    sequence: '#002',
    title: 'Câu 2: Phân tích sự khác biệt giữa nguyên tử và phân tử trong hóa học vô cơ.',
    content: 'Trình bày sự khác biệt cơ bản giữa nguyên tử và phân tử.',
    tags: ['Hóa học'],
    documentName: 'Đề Hóa học - Lý thuyết',
    status: 'processing',
    lastModified: '5 minutes ago',
  },
  {
    id: '3',
    sequence: '#003',
    title: 'Câu 3: Đọc đoạn văn sau và trả lời các câu hỏi về ý chính và cấu trúc.',
    content: 'Đọc đoạn văn sau và trả lời câu hỏi.',
    tags: ['Ngữ văn', 'Trung bình'],
    documentName: 'Bài tập Ngữ văn 12',
    status: 'completed',
    lastModified: '10 minutes ago',
  },
  {
    id: '4',
    sequence: '#004',
    title: 'Câu 4: Tính tích phân xác định của hàm số từ 0 đến $\\pi/2$.',
    content: 'Tính tích phân xác định.',
    tags: ['Toán học'],
    documentName: 'Đề Toán học',
    status: 'completed',
    lastModified: '15 minutes ago',
  },
  {
    id: '5',
    sequence: '#005',
    title: 'Câu 5: Tại sao chiến tranh thế giới thứ hai lại kết thúc vào năm 1945?',
    content: 'Phân tích nguyên nhân kết thúc thế chiến 2.',
    tags: ['Lịch sử'],
    documentName: 'Câu hỏi Lịch sử ngẫu nhiên',
    status: 'review',
    lastModified: '1 hour ago',
  }
];
