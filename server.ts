import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';

// =========================================================================
// CẤU HÌNH REDIS ĐỒNG BỘ VỚI REDIS_URL CỦA VERCEL
// =========================================================================
const redisUrl = process.env.REDIS_URL || '';
const isRedisEnabled = Boolean(redisUrl);

let redis: Redis | null = null;
if (isRedisEnabled) {
  try {
    redis = new Redis(redisUrl);
    redis.on('error', (err) => console.error('Redis Client Error:', err));
    console.log('Đã kết nối kho Redis thành công!');
  } catch (err) {
    console.error('Lỗi khởi tạo Redis:', err);
    redis = null;
  }
} else {
  console.log('Chưa cấu hình REDIS_URL, tạm thời tắt chức năng lưu trữ 0 đồng.');
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

async function generateWithFallback(
  prompt: string,
  systemInstruction: string,
  responseSchema?: any
) {
  const config: any = {
    systemInstruction,
    temperature: 0.1,
  };

  if (responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = responseSchema;
  }

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      if (response?.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Mô hình ${model} gặp lỗi:`, err?.message || err);
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  throw lastError || new Error('Không thể kết nối đến hệ thống AI.');
}

// Word Analysis Table Schema
const wordTableSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Tiêu đề bảng họ từ và ngữ pháp' },
    paradigmType: { type: Type.STRING, description: 'Phân loại từ loại' },
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          caseOrPerson: { type: Type.STRING, description: 'Từ loại / Dạng thức' },
          singularForm: { type: Type.STRING, description: 'Dạng thức tiếng Anh' },
          singularMeaning: { type: Type.STRING, description: 'Nghĩa tiếng Việt tương ứng' },
          pluralForm: { type: Type.STRING, description: 'Thuật ngữ Pāḷi' },
          pluralMeaning: { type: Type.STRING, description: 'Ghi chú ngữ cảnh' },
          isCurrentSingular: { type: Type.BOOLEAN },
          isCurrentPlural: { type: Type.BOOLEAN },
        },
        required: ['caseOrPerson', 'singularForm', 'singularMeaning', 'pluralForm', 'pluralMeaning'],
      },
    },
  },
  required: ['title', 'rows'],
};

const BUDDHIST_TERMINOLOGY_MANDATE = `
QUY CHUẨN HỌC THUẬT BẮT BUỘC VỀ THUẬT NGỮ ANH VĂN PHẬT PHÁP:
- Sử dụng chuẩn quốc tế: Pali Text Society (PTS), Bhikkhu Bodhi, Nyanatiloka, Thanissaro Bhikkhu.
- Tuyệt đối không dùng tiếng Anh giao tiếp thế tục, bám sát kinh tạng.
`;

// =========================================================================
// API BỘ ĐẾM & TRENDING SEARCHES (APP ANH VĂN)
// =========================================================================
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    if (isRedisEnabled && redis) {
      const currentViews = await redis.incr('eng_buddhist_page_views');
      const searchesStr = await redis.get('eng_buddhist_search_count');

      let trending: string[] = [];
      try {
        trending = await redis.zrevrange('eng_buddhist_trending_searches', 0, 4);
      } catch (err) {
        console.warn('Lỗi đọc trending:', err);
      }

      res.json({ 
        views: currentViews || 0, 
        searches: searchesStr ? parseInt(searchesStr, 10) : 0,
        trending: trending
      });
    } else {
      res.json({ views: 0, searches: 0, trending: [] });
    }
  } catch (err) {
    console.error('Lỗi lấy thông số:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Unified handler for Buddhist hub
app.post('/api/buddhist-hub', async (req: Request, res: Response) => {
  try {
    const { mode, input } = req.body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      res.status(400).json({ error: 'Vui lòng cung cấp nội dung cần xử lý.' });
      return;
    }

    const cleanInput = input.trim();
    const cacheKey = `eng_${mode}_${cleanInput.toLowerCase()}`;

    // ĐỌC DỮ LIỆU TỪ KHO CACHE
    if (isRedisEnabled && redis) {
      try {
        const cachedDataStr = await redis.get(cacheKey);
        if (cachedDataStr) {
          console.log('⚡ Đã lấy từ kho lưu trữ 0 đồng:', cacheKey);

          await redis.incr('eng_buddhist_search_count');
          if (cleanInput.length <= 40) {
            await redis.zincrby('eng_buddhist_trending_searches', 1, cleanInput.toLowerCase());
          }

          res.json({ mode, data: JSON.parse(cachedDataStr) });
          return;
        }
      } catch (e) {
        console.warn('Lỗi đọc kho:', e);
      }
    }

    let resultText = '';

    if (mode === 'eng-to-vi') {
      const systemInstruction = `Bạn là học giả uyên bác về Ngôn ngữ Anh Phật học và Pāḷi học. Phân tích thuật ngữ tiếng Anh Phật giáo theo 4 ý: 1. Từ gốc & Từ loại, 2. Hình thái & Ngữ pháp, 3. Nghĩa Phật học trực tiếp, 4. Bảng phân tích họ từ (tableData). ${BUDDHIST_TERMINOLOGY_MANDATE}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          analyzedWord: { type: Type.STRING },
          rootAndType: {
            type: Type.OBJECT,
            properties: {
              root: { type: Type.STRING },
              base: { type: Type.STRING },
              wordType: { type: Type.STRING },
              paliEquivalent: { type: Type.STRING },
              genderOrClass: { type: Type.STRING },
              etymologyNote: { type: Type.STRING },
            },
            required: ['root', 'base', 'wordType'],
          },
          currentMorphology: {
            type: Type.OBJECT,
            properties: {
              classification: { type: Type.STRING },
              englishTerm: { type: Type.STRING },
              paliTerm: { type: Type.STRING },
              number: { type: Type.STRING },
              summary: { type: Type.STRING },
              alternativeForms: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['classification', 'number', 'summary'],
          },
          directMeaning: { type: Type.STRING },
          nuancesAndTraditions: { type: Type.STRING },
          markdownTable: { type: Type.STRING },
          tableData: wordTableSchema,
          formattedMarkdown: { type: Type.STRING },
        },
        required: ['analyzedWord', 'rootAndType', 'currentMorphology', 'directMeaning', 'markdownTable', 'tableData', 'formattedMarkdown'],
      };

      resultText = await generateWithFallback(`Thuật ngữ tiếng Anh Phật giáo: "${cleanInput}"`, systemInstruction, responseSchema);
    } 
    else if (mode === 'vi-to-eng') {
      const systemInstruction = `Chuyên gia dịch thuật kinh điển Phật học Việt - Anh. Phân tích 3 ý: 1. Thuật ngữ tiếng Anh chuẩn, 2. Phân tích phương án dịch, 3. Bảng đối chiếu. ${BUDDHIST_TERMINOLOGY_MANDATE}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          vietnameseWord: { type: Type.STRING },
          analyzedWord: { type: Type.STRING },
          rootAndType: {
            type: Type.OBJECT,
            properties: {
              root: { type: Type.STRING },
              base: { type: Type.STRING },
              wordType: { type: Type.STRING },
              paliEquivalent: { type: Type.STRING },
              genderOrClass: { type: Type.STRING },
              etymologyNote: { type: Type.STRING },
            },
            required: ['root', 'base', 'wordType'],
          },
          currentMorphology: {
            type: Type.OBJECT,
            properties: {
              classification: { type: Type.STRING },
              englishTerm: { type: Type.STRING },
              paliTerm: { type: Type.STRING },
              number: { type: Type.STRING },
              summary: { type: Type.STRING },
              alternativeForms: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['classification', 'number', 'summary'],
          },
          directMeaning: { type: Type.STRING },
          markdownTable: { type: Type.STRING },
          tableData: wordTableSchema,
          formattedMarkdown: { type: Type.STRING },
        },
        required: ['vietnameseWord', 'analyzedWord', 'rootAndType', 'currentMorphology', 'markdownTable', 'tableData', 'formattedMarkdown'],
      };

      resultText = await generateWithFallback(`Thuật ngữ tiếng Việt Phật pháp: "${cleanInput}"`, systemInstruction, responseSchema);
    } 
    else if (mode === 'sentence-eng-to-vi') {
      const systemInstruction = `Phân tích cú pháp và dịch đoạn văn Anh văn Phật học kinh điển. Trả về cấu trúc 3 lớp dữ liệu cho từng từ và bản dịch mượt mà.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          originalSentence: { type: Type.STRING },
          words: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                vietnameseMeaning: { type: Type.STRING },
                abbreviation: { type: Type.STRING },
                detailedAnalysis: { type: Type.STRING },
              },
              required: ['word', 'vietnameseMeaning', 'abbreviation', 'detailedAnalysis'],
            },
          },
          smoothTranslation: { type: Type.STRING },
          rawOutput: { type: Type.STRING },
        },
        required: ['originalSentence', 'words', 'smoothTranslation', 'rawOutput'],
      };

      resultText = await generateWithFallback(`Đoạn văn tiếng Anh Phật học: "${cleanInput}"`, systemInstruction, responseSchema);
    } 
    else if (mode === 'compare-eng-pali') {
      const systemInstruction = `Đối chiếu sâu sắc giữa thuật ngữ tiếng Anh và nguyên tác Pāḷi. Trả về cấu trúc so sánh học thuật.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          englishTerm: { type: Type.STRING },
          paliTerm: { type: Type.STRING },
          sanskritTerm: { type: Type.STRING },
          vietnameseTerm: { type: Type.STRING },
          paliEtymology: { type: Type.STRING },
          scholarlyTranslations: { type: Type.STRING },
          semanticComparison: { type: Type.STRING },
          comparisonPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                aspect: { type: Type.STRING },
                paliPerspective: { type: Type.STRING },
                englishPerspective: { type: Type.STRING },
                analysis: { type: Type.STRING },
              },
              required: ['aspect', 'paliPerspective', 'englishPerspective', 'analysis'],
            },
          },
          classicalQuotes: { type: Type.STRING },
          rawOutput: { type: Type.STRING },
        },
        required: ['englishTerm', 'paliTerm', 'vietnameseTerm', 'paliEtymology', 'semanticComparison', 'rawOutput'],
      };

      resultText = await generateWithFallback(`Thuật ngữ cần so sánh Anh - Pāḷi: "${cleanInput}"`, systemInstruction, responseSchema);
    } 
    else {
      res.status(400).json({ error: `Chế độ không hợp lệ: ${mode}` });
      return;
    }

    const finalData = JSON.parse(resultText);

    if (isRedisEnabled && redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(finalData));
        await redis.incr('eng_buddhist_search_count');
        if (cleanInput.length <= 40) {
          await redis.zincrby('eng_buddhist_trending_searches', 1, cleanInput.toLowerCase());
        }
      } catch (e) {
        console.warn('Lỗi lưu kho:', e);
      }
    }

    res.json({ mode, data: finalData });

  } catch (err: any) {
    console.error('Lỗi API buddhist-hub:', err);
    res.status(500).json({ error: 'Lỗi khi xử lý: ' + (err?.message || 'Lỗi nội bộ.') });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server Tra Cứu Anh Văn Phật Pháp running on port ${port}`);
});
