import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 5): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        // Exponential backoff: 2s, 4s, 8s, 16s...
        const delayMs = Math.pow(2, attempt) * 1000 + (Math.random() * 1000); // Add jitter
        console.warn(`[Gemini API] Vượt quá hạn mức 429 (Lần thử ${attempt}/${maxRetries - 1}). Thử lại sau ${Math.round(delayMs)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Vượt quá số lần thử lại tối đa từ Gemini API");
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/analyze", async (req, res) => {
    try {
      const { content } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const ai = new GoogleGenAI({ apiKey });
      
      const responseStream = await executeWithRetry(() => ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: `Từ nội dung sau đây, hãy trích xuất ra từng câu hỏi/bài tập riêng biệt có trong văn bản. Không tự giải bài tập, chỉ giữ nguyên nội dung gốc nhưng định dạng lại cho đẹp mắt.

Yêu cầu định dạng bắt buộc:
1. Bạn BẮT BUỘC phải viết ra các bước phân tích (action history) của mình vào trong thẻ <action_history> và đóng bằng </action_history> trước khi trả về kết quả Markdown.
2. Trả về đúng định dạng Markdown.
3. Sử dụng thẻ Heading 2 cho các từ khóa bắt đầu câu hỏi và không cần dấu hai chấm ở cuối, ví dụ: ## Câu 1, ## Bài 2. (Tuyệt đối không dùng in đậm kiểu **Câu 1:**)
4. Các danh sách, các câu (a, b, c) phải được thụt lề (indent) hợp lý và rõ ràng.
5. Bọc TẤT CẢ các công thức, biểu thức, ký hiệu toán học bằng chuẩn LaTeX: dùng $...$ cho công thức ngắn trên cùng dòng (inline), và $$...$$ cho công thức đứng riêng thành dòng khối (block).
6. Phân tách mỗi câu hỏi bằng một dòng trống (\n\n).

Nội dung cần trích xuất:
${content}`,
        config: {
          systemInstruction: "Bạn là một hệ thống tự động hóa xử lý văn bản giáo dục. Nhiệm vụ của bạn là nhận văn bản thô, trích xuất và định dạng lại các câu hỏi/bài tập chuẩn xác theo định dạng Markdown, giữ nguyên cấu trúc toán học bằng LaTeX để render hiển thị chính xác trên web, thụt dòng rõ ràng và sử dụng thẻ Heading 2 (##) cho các tiêu đề 'Câu'."
        }
      }));

      for await (const chunk of responseStream) {
        if (chunk.text) {
          const data = JSON.stringify({ text: chunk.text });
          res.write(`data: ${data}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error: any) {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/solve", async (req, res) => {
    try {
      const { content } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const ai = new GoogleGenAI({ apiKey });
      
      const responseStream = await executeWithRetry(() => ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: `Trước tiên, bạn BẮT BUỘC phải viết ra các bước phân tích (action history) của mình vào trong thẻ <action_history> và đóng bằng </action_history>.
Sau đó, hãy trình bày lời giải chi tiết, từng bước một cho bài toán/câu hỏi sau đây.
Sử dụng Markdown và bọc các công thức Toán học trong thẻ chuẩn LaTeX ($...$ hoặc $$...$$).

Nội dung:
${content}`,
        config: {
          systemInstruction: "Bạn là một trợ lý giáo viên xuất sắc. Nhiệm vụ của bạn là giải bài tập từng bước, giải thích cặn kẽ để sinh viên có thể hiểu rõ phương pháp giải. Định dạng trình bày đẹp bằng Markdown và LaTeX."
        }
      }));

      for await (const chunk of responseStream) {
        if (chunk.text) {
          const data = JSON.stringify({ text: chunk.text });
          res.write(`data: ${data}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error: any) {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
