import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { kv } from '@vercel/kv';
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

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const candidateModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash'];

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
// (BUDDHIST TERMINOLOGY STRICT MANDATE & PHILOSOPHICAL FRAMEWORK)
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

// Unified handler for Buddhist hub
async function handleBuddhistHubRequest(req: Request, res: Response) {
  try {
    const { mode, input } = req.body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      res.status(400).json({ error: 'Vui lòng cung cấp nội dung cần xử lý.' });
      return;
    }

    const cleanInput = input.trim();

    // Mapping legacy modes to new Buddhist English modes if passed
    let activeMode = mode;
    if (activeMode === 'pali-to-vi') activeMode = 'eng-to-vi';
    else if (activeMode === 'vi-to-pali') activeMode = 'vi-to-eng';
    else if (activeMode === 'sentence-pali-to-vi') activeMode = 'sentence-eng-to-vi';
    else if (activeMode === 'sentence-vi-to-pali') activeMode = 'compare-eng-pali';

    // TIỀN TỐ KHO LƯU TRỮ CHO DỰ ÁN ENGLISH
    const cacheKey = \`eng_\${activeMode}_\${cleanInput.toLowerCase()}\`;

    // LƯỚI LỌC 0 ĐỒNG: TÌM TRONG KHO VERCEL KV TRƯỚC
    try {
      const cachedData = await kv.get(cacheKey);
      if (cachedData) {
        console.log('⚡ Đã lấy từ kho lưu trữ 0 đồng:', cacheKey);
        res.json({ mode: activeMode, data: cachedData });
        return; // Dừng lại, bốc dữ liệu ra ngay không tốn tiền gọi AI
      }
    } catch (e) {
      console.warn('Lỗi đọc kho (vẫn tiếp tục gọi AI):', e);
    }

    let resultText = '';

    // TAB 1: Tra từ Anh - Việt (Phật pháp)
    if (activeMode === 'eng-to-vi') {
      const systemInstruction = \`Bạn là đại học giả uyên bác về Ngôn ngữ Anh Phật học (Buddhist English Philology) và Phạn - Pāḷi học. Khi người dùng nhập một thuật ngữ hoặc từ tiếng Anh Phật giáo, hãy phân tích cực kỳ gãy gọn, chuẩn xác và mang tầm vóc học thuật kinh viện theo 4 ý chính:

\${BUDDHIST_TERMINOLOGY_MANDATE}

CẤU TRÚC 4 Ý PHÂN TÍCH:
1. Từ gốc & Từ loại: Gốc từ tiếng Anh/La-tinh, từ loại tiếng Anh, thuật ngữ Pāḷi/Sanskrit tương đương chuẩn xác nhất (kèm ngữ căn).
2. Hình thái & Ngữ pháp: Dạng danh từ trừu tượng, tính từ, động từ, số ít/số nhiều, họ từ chuyên ngành Phật học (Buddhist Word Family).
3. Nghĩa Phật học trực tiếp & Sắc thái dịch thuật: Nghĩa tiếng Việt chuẩn xác nhất theo các bậc đại dịch giả kinh điển (HT. Thích Minh Châu, HT. Thích Trí Siêu, Bhikkhu Bodhi, PTS); phân biệt rõ sắc thái Theravāda hoặc Mahāyāna dưới góc nhìn giáo lý.
4. Bảng phân tích họ từ (Word Family & Paradigm: Noun, Adjective, Verb, Adverb, hoặc thuật ngữ Pāḷi/Sanskrit đối ứng).

QUY TẮC CỘT TRONG BẢNG (tableData.rows):
Cột 'caseOrPerson' BẮT BUỘC ghi bằng TIẾNG VIỆT có số thứ tự:
1. Danh từ chính (Noun), 2. Tính từ (Adjective), 3. Động từ liên hệ (Verb), 4. Trạng từ (Adverb), 5. Thuật ngữ Pāḷi đối ứng (Pāli Term)...\`;

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
              genderOrClass: { type: Type.STRING, description: 'Phân loại ngữ pháp' },
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
          formattedMarkdown: { type: Type.STRING, description: 'Toàn văn phân tích định dạng Markdown chuẩn 4 ý' },
        },
        required: [
          'analyzedWord',
          'rootAndType',
          'currentMorphology',
          'directMeaning',
          'markdownTable',
          'tableData',
          'formattedMarkdown',
        ],
      };

      resultText = await generateWithFallback(
        \`Thuật ngữ tiếng Anh Phật giáo: "\${cleanInput}"\`,
        systemInstruction,
        responseSchema
      );
    }

    // TAB 2: Tra từ Việt - Anh (Phật pháp)
    else if (activeMode === 'vi-to-eng') {
      const systemInstruction = \`Bạn là chuyên gia hàng đầu về dịch thuật kinh điển Phật học song ngữ Việt - Anh. Khi người dùng nhập một thuật ngữ Phật học tiếng Việt (hoặc Hán - Việt), hãy tra cứu thuật ngữ tiếng Anh chuẩn xác nhất và phân tích gãy gọn theo 3 ý chính:

\${BUDDHIST_TERMINOLOGY_MANDATE}

CẤU TRÚC 3 Ý PHÂN TÍCH:
1. Thuật ngữ tiếng Anh chuẩn xác nhất: TUYỆT ĐỐI dùng thuật ngữ chuyên ngành kinh điển (ví dụ: "chánh niệm" -> "Mindfulness / Sati", "vô ngã" -> "Non-self / Anattā", "duyên khởi" -> "Dependent Origination / Paṭiccasamuppāda"), kèm từ Pāḷi/Sanskrit gốc. Cấm dùng từ ngữ thế tục.
2. Phân tích từ loại, hình thái ngữ pháp tiếng Anh và các phương án dịch thuật của các dịch giả danh tiếng (Bhikkhu Bodhi, Pali Text Society, Thanissaro Bhikkhu, Edward Conze...).
3. Bảng đối chiếu các cách dịch tiếng Anh theo từng ngữ cảnh/truyền thống học thuật.

QUY TẮC CỘT TRONG BẢNG (tableData.rows):
Cột 'caseOrPerson' BẮT BUỘC ghi bằng TIẾNG VIỆT có số thứ tự:
1. Thuật ngữ thông dụng nhất trong kinh văn, 2. Bản dịch của Bhikkhu Bodhi, 3. Bản dịch của PTS (Pali Text Society), 4. Bản dịch của Edward Conze / Thiền học, 5. Thuật ngữ triết học phương Tây tương đương...\`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          vietnameseWord: { type: Type.STRING },
          analyzedWord: { type: Type.STRING, description: 'Thuật ngữ tiếng Anh chuẩn xác nhất' },
          rootAndType: {
            type: Type.OBJECT,
            properties: {
              root: { type: Type.STRING, description: 'Thuật ngữ Pāḷi/Sanskrit gốc' },
              base: { type: Type.STRING, description: 'Dạng tiếng Anh cơ bản' },
              wordType: { type: Type.STRING, description: 'Từ loại tiếng Anh' },
              paliEquivalent: { type: Type.STRING, description: 'Thuật ngữ Pāḷi' },
              genderOrClass: { type: Type.STRING },
              etymologyNote: { type: Type.STRING, description: 'Phân tích căn nguyên triết học Phật giáo' },
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
          directMeaning: { type: Type.STRING, description: 'Nghĩa tiếng Việt chuẩn Phật học' },
          markdownTable: { type: Type.STRING },
          tableData: wordTableSchema,
          formattedMarkdown: { type: Type.STRING },
        },
        required: [
          'vietnameseWord',
          'analyzedWord',
          'rootAndType',
          'currentMorphology',
          'markdownTable',
          'tableData',
          'formattedMarkdown',
        ],
      };

      resultText = await generateWithFallback(
        \`Thuật ngữ tiếng Việt Phật pháp: "\${cleanInput}"\`,
        systemInstruction,
        responseSchema
      );
    }

    // TAB 3: Phân tích & Dịch đoạn văn Anh - Việt
    else if (activeMode === 'sentence-eng-to-vi') {
      const systemInstruction = \`Bạn là đại học giả phân tích cú pháp và dịch thuật Anh văn Phật học kinh điển (Buddhist Canon & Sutta Studies). 

\${BUDDHIST_TERMINOLOGY_MANDATE}

BẮT BUỘC kết quả phân tích từng từ/cụm từ trong câu phải có đầy đủ 3 lớp dữ liệu:
1. [Từ / Cụm từ tiếng Anh]: Từ/cụm từ trong câu (nguyên dạng đang phân tích).
2. [Nghĩa tiếng Việt trực tiếp]: Dịch nghĩa tiếng Việt chuẩn xác và trực tiếp nhất của từ tại đúng ngữ cảnh câu kinh văn (ví dụ: "chánh niệm", "duyên khởi", "hành giả", "thuyết giảng", "đoạn trừ phiền não"... Tuyệt đối không dịch theo lối văn nói đời thường).
3. [Giải phẫu ngữ pháp chi tiết]:
 - Ký hiệu viết tắt cú pháp: ví dụ (n, subj), (v, past-part), (adj, pred), (prep-phr), (rel-pron)...
 - Giải nghĩa chi tiết về chức năng cú pháp, liên hệ trực tiếp đến thuật ngữ Pāḷi/Sanskrit gốc nếu từ đó mang nội hàm giáo lý trọng tâm.
Cuối cùng xuất ra: "=> [Bản dịch tiếng Việt mượt mà hoàn chỉnh của toàn đoạn, bảo đảm văn phong thanh tịnh, tôn nghiêm, chuẩn mực kinh tạng Phật giáo (tương đương văn phong HT. Thích Minh Châu)]".\`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          originalSentence: { type: Type.STRING },
          words: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: 'Từ / Cụm từ tiếng Anh trong câu' },
                vietnameseMeaning: { type: Type.STRING, description: 'Nghĩa tiếng Việt trực tiếp chuẩn Phật học' },
                abbreviation: { type: Type.STRING, description: 'Ký hiệu ngữ pháp tiếng Anh: (n, subj), (v, pres), (adj)...' },
                detailedAnalysis: { type: Type.STRING, description: 'Giải phẫu ngữ pháp chi tiết và đối chiếu thuật ngữ Phật học Pāḷi' },
              },
              required: ['word', 'vietnameseMeaning', 'abbreviation', 'detailedAnalysis'],
            },
          },
          smoothTranslation: { type: Type.STRING, description: 'Bản dịch tiếng Việt mượt mà hoàn chỉnh của toàn câu' },
          rawOutput: { type: Type.STRING, description: 'Toàn văn định dạng đúng yêu cầu 3 lớp dữ liệu và => [Bản dịch tiếng Việt mượt mà]' },
        },
        required: ['originalSentence', 'words', 'smoothTranslation', 'rawOutput'],
      };

      resultText = await generateWithFallback(
        \`Đoạn văn tiếng Anh Phật học: "\${cleanInput}"\`,
        systemInstruction,
        responseSchema
      );
    }

    // TAB 4: So sánh thuật ngữ (Anh - Pāḷi)
    else if (activeMode === 'compare-eng-pali') {
      const systemInstruction = \`Bạn là nhà ngữ văn học đối chiếu Phật giáo chuyên sâu (Pāli Philology & English Translation Studies). Hãy so sánh sâu sắc giữa thuật ngữ tiếng Anh và nguyên tác Pāḷi (kèm thuật ngữ Hán - Việt tương ứng):

\${BUDDHIST_TERMINOLOGY_MANDATE}

NỘI DUNG ĐỐI CHIẾU BẮT BUỘC:
1. Phân tích nguyên ngữ Pāḷi: ngữ căn (root), tiền tố, tiếp vĩ ngữ, ý nghĩa gốc trong Tam tạng Pāḷi (Tipiṭaka).
2. Cách các đại học giả phương Tây (T.W. Rhys Davids, Bhikkhu Bodhi, I.B. Horner, Nyanatiloka, Thanissaro Bhikkhu...) dịch sang tiếng Anh.
3. So sánh ngữ nghĩa (Semantic comparison): Thuật ngữ tiếng Anh lột tả được khía cạnh nào và làm lu mờ hoặc sai lệch (semantic loss/distortion) khía cạnh triết học nào so với Pāḷi gốc (ví dụ: Dukkha dịch là "Suffering" thường bị hiểu hẹp theo tâm lý học thế tục mà mất đi tầng nghĩa "bất toàn, biến hoại của các hành hữu vi"; Sati dịch là "Mindfulness" đôi khi bị tách rời khỏi Chánh định và Chánh kiến trong Bát Chánh Đạo).
4. Bảng các điểm so sánh chính (comparisonPoints).
5. Trích dẫn câu kinh văn điển hình song ngữ (Pāḷi - Anh - Việt) minh họa.\`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          englishTerm: { type: Type.STRING, description: 'Thuật ngữ tiếng Anh' },
          paliTerm: { type: Type.STRING, description: 'Thuật ngữ Pāḷi' },
          sanskritTerm: { type: Type.STRING, description: 'Thuật ngữ Phạn (Sanskrit) tương ứng' },
          vietnameseTerm: { type: Type.STRING, description: 'Thuật ngữ Hán - Việt tương ứng' },
          paliEtymology: { type: Type.STRING, description: 'Ngữ căn & cấu tạo từ Pāḷi' },
          scholarlyTranslations: { type: Type.STRING, description: 'Các phương án dịch tiếng Anh của học giả uy tín' },
          semanticComparison: { type: Type.STRING, description: 'Phân tích đối chiếu ngữ nghĩa sâu sắc' },
          comparisonPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                aspect: { type: Type.STRING, description: 'Khía cạnh so sánh' },
                paliPerspective: { type: Type.STRING, description: 'Góc nhìn Pāḷi gốc' },
                englishPerspective: { type: Type.STRING, description: 'Góc nhìn bản dịch tiếng Anh' },
                analysis: { type: Type.STRING, description: 'Nhận định học thuật & sắc thái' },
              },
              required: ['aspect', 'paliPerspective', 'englishPerspective', 'analysis'],
            },
          },
          classicalQuotes: { type: Type.STRING, description: 'Trích dẫn kinh văn mẫu song ngữ' },
          rawOutput: { type: Type.STRING, description: 'Toàn bộ bài phân tích đối chiếu định dạng Markdown' },
        },
        required: [
          'englishTerm',
          'paliTerm',
          'vietnameseTerm',
          'paliEtymology',
          'semanticComparison',
          'rawOutput',
        ],
      };

      resultText = await generateWithFallback(
        \`Thuật ngữ cần so sánh Anh - Pāḷi: "\${cleanInput}"\`,
        systemInstruction,
        responseSchema
      );
    }
    
    else {
      res.status(400).json({ error: \`Chế độ không hợp lệ: \${mode}\` });
      return;
    }

    // BƯỚC KHÓA ĐUÔI: CẤT KẾT QUẢ VÀO KHO RỒI MỚI TRẢ VỀ
    const finalData = JSON.parse(resultText);
    try {
      await kv.set(cacheKey, finalData); // Lưu vĩnh viễn vào Vercel KV
    } catch (e) {
      console.warn('Lỗi lưu kho:', e);
    }
    
    res.json({ mode: activeMode, data: finalData });

  } catch (err: any) {
    console.error('Lỗi API buddhist-hub:', err);
    res.status(500).json({ error: 'Lỗi khi xử lý: ' + (err?.message || 'Lỗi nội bộ.') });
  }
}

// Router chính
app.post('/api/buddhist-hub', handleBuddhistHubRequest);

// Backward compatibility cho /api/pali-hub
app.post('/api/pali-hub', handleBuddhistHubRequest);

// Legacy backward-compatible endpoint
app.post('/api/analyze-pali', async (req: Request, res: Response) => {
  try {
    const { word } = req.body;
    if (!word) {
      res.status(400).json({ error: 'Thiếu từ cần tra.' });
      return;
    }
    const response = await fetch(\`http://localhost:\${port}/api/buddhist-hub\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'eng-to-vi', input: word }),
    });
    const result = await response.json();
    if (result.data) {
      res.json({
        ...result.data,
        fourPointsFormattedMarkdown: result.data.formattedMarkdown,
      });
    } else {
      res.status(500).json(result);
    }
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

// Mounting Vite in development or static in production
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
  console.log(\`Server Tra Cứu Anh Văn Phật Pháp running on port \${port}\`);
});
