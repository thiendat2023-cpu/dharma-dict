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

// Word Analysis Table Schema (Dùng trong Mode 1 & 2)
const wordTableSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Tiêu đề bảng họ từ và ngữ pháp' },
    paradigmType: { type: Type.STRING, description: 'Phân loại từ loại (Danh từ / Động từ / Tính từ / Họ từ)' },
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          caseOrPerson: {
            type: Type.STRING,
            description: 'Từ loại / Dạng thức BẰNG TIẾNG VIỆT có số thứ tự: 1. Danh từ trừu tượng (Abstract Noun), 2. Tính từ (Adjective), 3. Động từ (Verb), 4. Trạng từ (Adverb)...',
          },
          singularForm: { type: Type.STRING, description: 'Dạng thức tiếng Anh' },
          singularMeaning: { type: Type.STRING, description: 'Nghĩa tiếng Việt tương ứng' },
          pluralForm: { type: Type.STRING, description: 'Thuật ngữ Pāḷi / Biến thể từ loại' },
          pluralMeaning: { type: Type.STRING, description: 'Ghi chú ngữ cảnh Phật học' },
          isCurrentSingular: { type: Type.BOOLEAN, description: 'True nếu trùng khớp từ đang tra' },
          isCurrentPlural: { type: Type.BOOLEAN, description: 'True nếu trùng khớp dạng biến thể' },
        },
        required: ['caseOrPerson', 'singularForm', 'singularMeaning', 'pluralForm', 'pluralMeaning'],
      },
    },
  },
  required: ['title', 'rows'],
};

// =========================================================================
// RÀNG BUỘC CỰC KỲ NGHIÊM NGẶT VỀ THUẬT NGỮ PHẬT HỌC CHUYÊN NGÀNH
// =========================================================================
const BUDDHIST_TERMINOLOGY_MANDATE = `
QUY CHUẨN HỌC THUẬT BẮT BUỘC VỀ THUẬT NGỮ ANH VĂN PHẬT PHÁP (BUDDHIST TERMINOLOGY MANDATE):
1. TUYỆT ĐỐI CHUẨN HOÁ THEO KINH ĐIỂN VÀ CÁC ĐẠI HỌC GIẢ DANH TIẾNG:
- BẮT BUỘC sử dụng hệ thống thuật ngữ Phật học quốc tế được chuẩn hoá bởi các hội dịch thuật và học giả uy tín: Pali Text Society (PTS - T.W. Rhys Davids, I.B. Horner), Ven. Bhikkhu Bodhi, Ven. Nyanatiloka (Buddhist Dictionary), Ven. Thanissaro Bhikkhu, Edward Conze, Wisdom Publications.
- TUYỆT ĐỐI CẤM sử dụng tiếng Anh giao tiếp thông thường, khẩu ngữ đời thường hoặc giải nghĩa sơ sài theo lối thế tục.
  * NGHIÊM CẤM: "Good path", "Origin of everything", "Bad feelings", "Bad karma", "Thinking about breath", "Peaceful mind", "Real thing", "No self-existence".
  * BẮT BUỘC SỬ DỤNG: "Noble Eightfold Path" (Ariya Aṭṭhaṅgika Magga), "Dependent Origination / Conditioned Genesis" (Paṭiccasamuppāda), "Mental Defilements / Afflictions / Taints" (Kilesa / Āsava), "Volitional Formations / Fabrications" (Saṅkhāra), "Mindfulness & Clear Comprehension" (Sati-sampajañña), "Tranquillity and Insight" (Samatha & Vipassanā), "Cessation of Suffering" (Dukkha-nirodha), "Stream-enterer" (Sotāpanna), "Once-returner" (Sakadāgāmī), "Non-returner" (Anāgāmī), "Arahantship" (Arahatta), "Unconditioned Element" (Asaṅkhatā-dhātu).

2. LĂNG KÍNH TRIẾT HỌC PHẬT GIÁO & ĐỐI CHIẾU CHÉO NGUỒN GỐC PĀḶI/SANSKRIT:
- Mọi định nghĩa và phân tích BẮT BUỘC phải soi chiếu qua lăng kính triết học Phật học: Duyên khởi (Paṭiccasamuppāda), Tam tướng (Anicca - Dukkha - Anattā), Tứ diệu đế (Cattāri Ariyasaccāni), và Vi diệu pháp (Abhidhamma).
- Bắt buộc đối chiếu chéo sắc thái nghĩa của từ tiếng Anh với ngữ căn (root), tiền tố (prefix), tiếp vĩ ngữ (suffix) trong Pāḷi/Sanskrit để bảo chứng độ chính xác học thuật tuyệt đối.
- Làm sáng tỏ sự chuyển biến ngữ nghĩa (semantic shifts) và những hạn chế của tiếng Anh khi chuyển ngữ từ văn ngôn kinh điển phương Đông.
`;

// =========================================================================
// API BỘ ĐẾM & TRENDING SEARCHES (TOP 5) DÙNG REDIS VERCEL KV CHO APP ANH VĂN
// =========================================================================
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    if (isRedisEnabled && redis) {
      // 1. Đọc số views và searches
      const viewsStr = await redis.get('eng_buddhist_page_views');
      const searchesStr = await redis.get('eng_buddhist_search_count');
      
      // 2. Tăng views ngầm (fire and forget)
      redis.incr('eng_buddhist_page_views').catch(e => console.warn('Lỗi tăng views:', e));

      // 3. Đọc Top 5 Trending Searches từ Sorted Set
      // ZREVRANGE: lấy phần tử có điểm số từ cao xuống thấp (từ vị trí 0 đến 4 = top 5)
      let trending: string[] = [];
      try {
        trending = await redis.zrevrange('eng_buddhist_trending_searches', 0, 4);
      } catch (err) {
        console.warn('Lỗi đọc trending:', err);
      }

      res.json({ 
        views: viewsStr ? parseInt(viewsStr, 10) : 0, 
        searches: searchesStr ? parseInt(searchesStr, 10) : 0,
        trending: trending
      });
    } else {
      res.json({ views: 'N/A', searches: 'N/A', trending: [] });
    }
  } catch (err) {
    console.error('Lỗi lấy thông số:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Unified handler for Buddhist hub
async function handleBuddhistHubRequest(req: Request, res: Response) {
  try {
    const { mode, input } = req.body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      res.status(400).json({ error: 'Vui lòng cung cấp nội dung cần xử lý.' });
      return;
    }

    const cleanInput = input.trim();

    let activeMode = mode;
    if (activeMode === 'pali-to-vi') activeMode = 'eng-to-vi';
    else if (activeMode === 'vi-to-pali') activeMode = 'vi-to-eng';
    else if (activeMode === 'sentence-pali-to-vi') activeMode = 'sentence-eng-to-vi';
    else if (activeMode === 'sentence-vi-to-pali') activeMode = 'compare-eng-pali';

    const cacheKey = `eng_${activeMode}_${cleanInput.toLowerCase()}`;

    // ĐỌC DỮ LIỆU TỪ KHO (NẾU CÓ)
    if (isRedisEnabled && redis) {
      try {
        const cachedDataStr = await redis.get(cacheKey);
        if (cachedDataStr) {
          console.log('⚡ Đã lấy từ kho lưu trữ 0 đồng:', cacheKey);
          res.json({ mode: activeMode, data: JSON.parse(cachedDataStr) });
          return;
        }
      } catch (e) {
        console.warn('Lỗi đọc kho (vẫn tiếp tục gọi AI):', e);
      }
    }

    let resultText = '';

    // TAB 1: Tra từ Anh - Việt (Phật pháp)
    if (activeMode === 'eng-to-vi') {
      const systemInstruction = `Bạn là đại học giả uyên bác về Ngôn ngữ Anh Phật học (Buddhist English Philology) và Phạn - Pāḷi học. Khi người dùng nhập một thuật ngữ hoặc từ tiếng Anh Phật giáo, hãy phân tích cực kỳ gãy gọn, chuẩn xác và mang tầm vóc học thuật kinh viện theo 4 ý chính:

${BUDDHIST_TERMINOLOGY_MANDATE}

CẤU TRÚC 4 Ý PHÂN TÍCH:
1. Từ gốc & Từ loại: Gốc từ tiếng Anh/La-tinh, từ loại tiếng Anh, thuật ngữ Pāḷi/Sanskrit tương đương chuẩn xác nhất (kèm ngữ căn).
2. Hình thái & Ngữ pháp: Dạng danh từ trừu tượng, tính từ, động từ, số ít/số nhiều, họ từ chuyên ngành Phật học (Buddhist Word Family).
3. Nghĩa Phật học trực tiếp & Sắc thái dịch thuật: Nghĩa tiếng Việt chuẩn xác nhất theo các bậc đại dịch giả kinh điển (HT. Thích Minh Châu, HT. Thích Trí Siêu, Bhikkhu Bodhi, PTS); phân biệt rõ sắc thái Theravāda hoặc Mahāyāna dưới góc nhìn giáo lý.
4. Bảng phân tích họ từ (Word Family & Paradigm: Noun, Adjective, Verb, Adverb, hoặc thuật ngữ Pāḷi/Sanskrit đối ứng).

QUY TẮC CỘT TRONG BẢNG (tableData.rows):
Cột 'caseOrPerson' BẮT BUỘC ghi bằng TIẾNG VIỆT có số thứ tự:
1. Danh từ chính (Noun), 2. Tính từ (Adjective), 3. Động từ liên hệ (Verb), 4. Trạng từ (Adverb), 5. Thuật ngữ Pāḷi đối ứng (Pāli Term)...`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          analyzedWord: { type: Type.STRING },
          rootAndType: {
            type: Type.OBJECT,
            properties: {
              root: { type: Type.STRING, description: 'Từ gốc / Etymology chuyên ngành' },
              base: { type: Type.STRING, description: 'Dạng từ nguyên mẫu' },
              wordType: { type: Type.STRING, description: 'Từ loại tiếng Anh học thuật' },
              paliEquivalent: { type: Type.STRING, description: 'Thuật ngữ Pāḷi tương đương' },
              genderOrClass: { type: Type.STRING },
              etymologyNote: { type: Type.STRING, description: 'Ghi chú từ nguyên & ngữ cảnh giáo lý sâu sắc' },
            },
            required: ['root', 'base', 'wordType'],
          },
          currentMorphology: {
            type: Type.OBJECT,
            properties: {
              classification: { type: Type.STRING, description: 'Phân loại từ loại chi tiết' },
              englishTerm: { type: Type.STRING },
              paliTerm: { type: Type.STRING },
              number: { type: Type.STRING, description: 'Hình thái (Singular/Plural/Uncountable)' },
              summary: { type: Type.STRING, description: 'Tóm lược ngữ pháp' },
              alternativeForms: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['classification', 'number', 'summary'],
          },
          directMeaning: { type: Type.STRING, description: 'Nghĩa Phật học trực tiếp tiếng Việt chuẩn kinh viện' },
          nuancesAndTraditions: { type: Type.STRING, description: 'Sắc thái dịch thuật qua lăng kính triết học Phật giáo' },
          markdownTable: { type: Type.STRING },
          tableData: wordTableSchema,
          formattedMarkdown: { type: Type.STRING, description: '
