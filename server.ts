import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const executeWithRetry = async <T>(operation: () => Promise<T>, onRetry?: (attempt: number, maxRetries: number, delayMs: number) => void, maxRetries = 5): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const isDailyLimit = error?.message?.includes("GenerateRequestsPerDayPerProjectPerModel") || error?.message?.includes("per day");
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === "Too Many Requests";
      const isUnavailable = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE") || error?.status === "Service Unavailable" || error?.message?.includes("experiencing high demand");
      
      const isRetryable = isRateLimit || isUnavailable;

      if (isDailyLimit) {
         throw new Error("Bạn đã sử dụng hết hạn mức 20 yêu cầu/ngày của gói API miễn phí. Hạn mức sẽ được làm mới vào lúc 14:00 (giờ Việt Nam) hàng ngày. Vui lòng thử lại sau.");
      } else if (isRetryable) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        
        let delayMs = Math.pow(2, attempt) * 1000 + (Math.random() * 1000); // Default exponential backoff

        // Try to parse "Please retry in X.Xs" or "retryDelay": "Xs"
        try {
          const match = error?.message?.match(/Please retry in ([\d\.]+)s/);
          if (match && match[1]) {
             delayMs = parseFloat(match[1]) * 1000 + 1000; // Add 1s buffer
          } else {
             const retryMatch = error?.message?.match(/"retryDelay":\s*"(\d+)s"/);
             if (retryMatch && retryMatch[1]) {
                delayMs = parseInt(retryMatch[1], 10) * 1000 + 1000;
             }
          }
        } catch (e) {}

        console.warn(`[Gemini API] Gặp lỗi ${isRateLimit ? '429' : '503'} (Lần thử ${attempt}/${maxRetries}). Thử lại sau ${Math.round(delayMs)}ms...`);
        if (onRetry) onRetry(attempt, maxRetries, delayMs);
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
      const { content, provider = "gemini", modelId } = req.body;
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const systemInstruction = "Bạn là một hệ thống tự động hóa xử lý văn bản giáo dục. Nhiệm vụ của bạn là nhận văn bản thô, trích xuất và định dạng lại các câu hỏi/bài tập chuẩn xác theo định dạng Markdown, giữ nguyên cấu trúc toán học bằng LaTeX để render hiển thị chính xác trên web, thụt dòng rõ ràng và sử dụng thẻ Heading 2 (##) cho các tiêu đề 'Câu'.";
      const contents = `Từ nội dung sau đây, hãy trích xuất ra từng câu hỏi/bài tập riêng biệt có trong văn bản. Không tự giải bài tập, chỉ giữ nguyên nội dung gốc nhưng định dạng lại cho đẹp mắt.

Yêu cầu định dạng bắt buộc:
1. Bạn BẮT BUỘC phải viết ra các bước phân tích (action history) của mình vào trong thẻ <action_history> và đóng bằng </action_history> trước khi trả về kết quả Markdown.
2. Trả về đúng định dạng Markdown.
3. Sử dụng thẻ Heading 2 cho các từ khóa bắt đầu câu hỏi và không cần dấu hai chấm ở cuối, ví dụ: ## Câu 1, ## Bài 2. (Tuyệt đối không dùng in đậm kiểu **Câu 1:**)
4. Các danh sách, các câu (a, b, c) phải được thụt lề (indent) hợp lý và rõ ràng.
5. Bọc TẤT CẢ các công thức, biểu thức, ký hiệu toán học bằng chuẩn LaTeX: dùng $...$ cho công thức ngắn trên cùng dòng (inline), và $$...$$ cho công thức đứng riêng thành dòng khối (block).
6. Phân tách mỗi câu hỏi bằng một dòng trống (\n\n).

Nội dung cần trích xuất:
${content}`;

      const validateKey = (key: string | undefined, name: string) => {
        if (!key) return `Missing ${name} environment variable`;
        if (key.includes('•')) return `Lỗi cấu hình: ${name} của bạn chứa các ký tự bị ẩn (•). Vui lòng dán nguyên văn API Key vào mục cài đặt.`;
        return null;
      };

      if (provider === "openrouter") {
        const apiKey = process.env.OPENROUTER_API_KEY;
        const err = validateKey(apiKey, "OPENROUTER_API_KEY");
        if (err) {
           res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
           return res.end();
        }
        const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: apiKey! });
        
        const responseStream = await executeWithRetry(() => openai.chat.completions.create({
          model: modelId || "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: contents }
          ],
          stream: true,
        }), (attempt, max, delayMs) => {
          res.write(`data: ${JSON.stringify({ rateLimit: { attempt, maxRetries: max, delayMs } })}\n\n`);
        });

        for await (const chunk of responseStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      } else {
        const apiKey = process.env.GEMINI_API_KEY;
        const err = validateKey(apiKey, "GEMINI_API_KEY");
        if (err) {
           res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
           return res.end();
        }
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        const responseStream = await executeWithRetry(() => ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents,
          config: { systemInstruction }
        }), (attempt, max, delayMs) => {
          res.write(`data: ${JSON.stringify({ rateLimit: { attempt, maxRetries: max, delayMs } })}\n\n`);
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
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
      const { content, provider = "gemini", modelId } = req.body;
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const systemInstruction = "Bạn là một trợ lý giáo viên xuất sắc. Nhiệm vụ của bạn là giải bài tập từng bước, giải thích cặn kẽ để sinh viên có thể hiểu rõ phương pháp giải. Định dạng trình bày đẹp bằng Markdown và LaTeX.";
      const contents = `Trước tiên, bạn BẮT BUỘC phải viết ra các bước phân tích (action history) của mình vào trong thẻ <action_history> và đóng bằng </action_history>.
Sau đó, hãy trình bày lời giải chi tiết, từng bước một cho bài toán/câu hỏi sau đây.
Sử dụng Markdown và bọc các công thức Toán học trong thẻ chuẩn LaTeX ($...$ hoặc $$...$$).

Nội dung:
${content}`;

      const validateKey = (key: string | undefined, name: string) => {
        if (!key) return `Missing ${name} environment variable`;
        if (key.includes('•')) return `Lỗi cấu hình: ${name} của bạn chứa các ký tự bị ẩn (•). Vui lòng dán nguyên văn API Key vào mục cài đặt.`;
        return null;
      };

      if (provider === "openrouter") {
        const apiKey = process.env.OPENROUTER_API_KEY;
        const err = validateKey(apiKey, "OPENROUTER_API_KEY");
        if (err) {
           res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
           return res.end();
        }
        const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: apiKey! });
        
        const responseStream = await executeWithRetry(() => openai.chat.completions.create({
          model: modelId || "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: contents }
          ],
          stream: true,
        }), (attempt, max, delayMs) => {
          res.write(`data: ${JSON.stringify({ rateLimit: { attempt, maxRetries: max, delayMs } })}\n\n`);
        });

        for await (const chunk of responseStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      } else {
        const apiKey = process.env.GEMINI_API_KEY;
        const err = validateKey(apiKey, "GEMINI_API_KEY");
        if (err) {
           res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
           return res.end();
        }
        const ai = new GoogleGenAI({ apiKey: apiKey! });
        
        const responseStream = await executeWithRetry(() => ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents,
          config: { systemInstruction }
        }), (attempt, max, delayMs) => {
          res.write(`data: ${JSON.stringify({ rateLimit: { attempt, maxRetries: max, delayMs } })}\n\n`);
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
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
