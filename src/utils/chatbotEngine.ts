import { KENNU_BIO, QA_DATABASE, QAEntry } from "../content/chatbotKnowledge";

// Function to detect whether a message is primarily Tagalog/Filipino or English
export function detectLanguage(text: string): "tl" | "en" {
  const lower = text.toLowerCase();
  const tagalogIndicators = [
    /\b(ano|anong|sino|sinong|paano|bakit|saan|kailan|nasaan|meron|wala|po|opo|ba|ng|mga|sa|kay|si|kung|pwede|puwede|pede|kumusta|kamusta|musta|salamat|taga|trabaho|gawa|ito|iyan|iyon|dito|dyan|doon|ako|ikaw|siya|tayo|sila|magkano|talaga|naman|lang|kasi|dahil|ginusto|pinili|jowa|gutom|ulam|tulog|puyat|singil|lugar|totoo|tunay|bentahe|pangalan|tawag|kasanayan|kumpanya|proyekto)\b/i,
  ];

  for (const regex of tagalogIndicators) {
    if (regex.test(lower)) {
      return "tl";
    }
  }
  return "en";
}

const TAGALOG_STOPWORDS = new Set([
  "ang",
  "ng",
  "sa",
  "mga",
  "si",
  "kay",
  "ni",
  "ay",
  "na",
  "ba",
  "ka",
  "ko",
  "mo",
  "po",
  "opo",
  "din",
  "rin",
  "pa",
  "naman",
  "kasi",
  "kaya",
  "eh",
  "ito",
  "iyan",
  "iyon",
  "dito",
  "dyan",
  "doon",
  "pala",
  "ha",
  "yung",
  "ung",
  "at",
  "o",
  "nga",
  "man",
  "daw",
  "raw",
  "natin",
  "ninyo",
  "inyo",
  "amin",
  "atin",
]);

const ENGLISH_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "and",
  "or",
  "to",
  "in",
  "of",
  "for",
  "with",
  "on",
  "at",
  "by",
  "this",
  "that",
  "it",
  "its",
  "you",
  "your",
  "i",
  "my",
  "we",
  "our",
  "he",
  "his",
  "she",
  "her",
  "they",
  "their",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "can",
  "could",
  "will",
  "would",
]);

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const PROFESSIONAL_FALLBACK_EN =
  "Inquiry acknowledged. For context regarding this portfolio: Kennu Elnar is an analytical Quality and Web Developer based in the Philippines. His technical discipline encompasses end-to-end software verification, defect lifecycle governance, and modern web application development using React, TypeScript, Tailwind CSS, and Playwright automation. Notable systems comprise MIRAMS (Enterprise Asset & Request Management), NCAMIS (Academic Management Architecture), and NobleClassics (Curated E-Commerce Infrastructure). You may download his complete Curriculum Vitae from the Capabilities section or initiate direct professional correspondence via elnarkennu16@gmail.com.";

export const PROFESSIONAL_FALLBACK_TL =
  "Kinikilala ang iyong katanungan. Bilang konteksto hinggil sa portfoliong ito: Si Kennu Elnar ay isang masusing Quality Assurance at Web Developer mula sa Pilipinas. Nakapokus ang kanyang disiplina sa komprehensibong pagberipika ng software, pamamahala ng defect lifecycle, at arkitektura ng modernong web applications gamit ang React, TypeScript, Tailwind CSS, at Playwright automation. Kabilang sa kanyang mga naisakatuparang sistema ang MIRAMS (Enterprise Asset & Request Management), NCAMIS (Academic Information Architecture), at NobleClassics (E-Commerce Infrastructure). Maaari mong suriin at i-download ang kanyang opisyal na Curriculum Vitae sa seksyon ng Capabilities, o direktang makipag-ugnayan sa elnarkennu16@gmail.com para sa mga propesyonal na talakayan.";

/**
 * High-accuracy query matcher with prioritized question intent parsing,
 * comprehensive pattern matching, and keyword scoring.
 */
export function getSmartLocalResponse(
  userInput: string,
  targetLang?: "en" | "tl",
): string {
  const cleanInput = userInput.trim().toLowerCase();
  const lang = targetLang || detectLanguage(userInput);

  // Check if input contains substantive question words or topic indicators
  const hasQuestionIntent =
    /\b(bakit|ano|anong|sino|sinong|paano|saan|kailan|magkano|pwede|puwede|pede|may|pangalan|why|what|who|how|where|when|can|is|are|does|do|could|should|tell|explain|name)\b/i.test(
      cleanInput,
    );

  // 1. Direct Pattern Match (prioritize specific entries over generic greetings if questions exist)
  // First pass: non-greeting entries
  for (const entry of QA_DATABASE) {
    if (entry.id === "greeting" && hasQuestionIntent) {
      continue; // skip pure greeting if user is asking a specific question
    }
    for (const pattern of entry.patterns) {
      if (pattern.test(cleanInput)) {
        return lang === "tl" ? entry.tl : entry.en;
      }
    }
  }

  // Second pass: greeting entry (if user strictly said hi/hello/kamusta)
  for (const entry of QA_DATABASE) {
    if (entry.id === "greeting") {
      for (const pattern of entry.patterns) {
        if (pattern.test(cleanInput)) {
          return lang === "tl" ? entry.tl : entry.en;
        }
      }
    }
  }

  // 2. Keyword & Intent Scoring Match
  const rawWords = cleanInput
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);

  const meaningfulWords = rawWords.filter(
    (w) => !TAGALOG_STOPWORDS.has(w) && !ENGLISH_STOPWORDS.has(w),
  );

  let bestScore = 0;
  let bestEntry: QAEntry | null = null;

  for (const entry of QA_DATABASE) {
    if (entry.id === "greeting" && hasQuestionIntent) {
      continue;
    }

    let score = 0;

    // Check entry keywords (+6 points per direct keyword match)
    if (entry.keywords) {
      for (const kw of entry.keywords) {
        const kwLower = kw.toLowerCase();
        if (cleanInput.includes(kwLower)) {
          score += 6;
        } else {
          for (const word of meaningfulWords) {
            if (kwLower === word) {
              score += 4;
            } else if (kwLower.includes(word) || word.includes(kwLower)) {
              score += 2;
            }
          }
        }
      }
    }

    // Check exact whole word presence in entry.en / entry.tl (+2 points per word)
    const combinedContent =
      `${entry.en} ${entry.tl} ${entry.category}`.toLowerCase();
    for (const word of meaningfulWords) {
      const wholeWordRegex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
      if (wholeWordRegex.test(combinedContent)) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 4) {
    return lang === "tl" ? bestEntry.tl : bestEntry.en;
  }

  // 3. Fallback: Cold, minimalist, high-level professional overview
  return lang === "tl" ? PROFESSIONAL_FALLBACK_TL : PROFESSIONAL_FALLBACK_EN;
}

/**
 * Returns both English and Tagalog answers for a query.
 */
export function getSmartLocalResponsesBoth(userInput: string): {
  en: string;
  tl: string;
} {
  const en = getSmartLocalResponse(userInput, "en");
  const tl = getSmartLocalResponse(userInput, "tl");
  return { en, tl };
}

/**
 * Accurately translates an existing bot message text between English and Tagalog.
 */
export function translateBotResponseText(
  text: string,
  targetLang: "en" | "tl",
): string {
  const trimmed = text.trim();

  // Handle greetings (both initial and formal greetings)
  const GREETING_EN =
    "I am the autonomous AI assistant for Kennu Elnar's portfolio. You may submit inquiries regarding his QA methodologies, technical architectures, full-stack systems, or curriculum vitae. Inquiries are processed in English, Filipino, or Taglish.";
  const GREETING_TL =
    "Ako ang opisyal na AI assistant para sa portfolio ni Kennu Elnar. Maaari kang sumangguni hinggil sa kanyang mga metodolohiya sa QA, arkitektura ng software, mga natapos na sistema, o curriculum vitae sa wikang Filipino, Ingles, o Taglish.";

  // Legacy greeting variations fallback
  const GREETING_EN_OLD =
    "Hello! I am Kennu Elnar's virtual assistant. Ask me anything about Kennu's QA testing, projects, tech stack, or CV. You can ask in English, Tagalog, or Taglish!";
  const GREETING_TL_OLD =
    "Magandang araw! Ako ang virtual assistant ni Kennu Elnar. Maaari kang magtanong tungkol sa kanyang QA testing, mga proyekto, kakayahan, o CV sa Tagalog, Ingles, o Taglish!";

  if (
    trimmed === GREETING_EN ||
    trimmed === GREETING_TL ||
    trimmed === GREETING_EN_OLD ||
    trimmed === GREETING_TL_OLD
  ) {
    return targetLang === "tl" ? GREETING_TL : GREETING_EN;
  }

  // Handle professional fallback translations
  if (
    trimmed === PROFESSIONAL_FALLBACK_EN.trim() ||
    trimmed === PROFESSIONAL_FALLBACK_TL.trim()
  ) {
    return targetLang === "tl"
      ? PROFESSIONAL_FALLBACK_TL
      : PROFESSIONAL_FALLBACK_EN;
  }

  // 1. Direct match in curated QA_DATABASE
  for (const entry of QA_DATABASE) {
    if (entry.en.trim() === trimmed || entry.tl.trim() === trimmed) {
      return targetLang === "tl" ? entry.tl : entry.en;
    }
  }

  // If text was not exact match, resolve via smart query matcher
  return getSmartLocalResponse(trimmed, targetLang);
}

export interface ChatbotReplyResult {
  replyText: string;
  textEn: string;
  textTl: string;
}

/**
 * Live AI Generation with bilingual support.
 * Returns both English and Tagalog texts along with the reply in the active language.
 */
export async function generateChatbotReply(
  userMessage: string,
  history: Array<{ sender: "user" | "bot"; text: string }>,
  preferredLang: "en" | "tl" = "en",
): Promise<ChatbotReplyResult> {
  const { en, tl } = getSmartLocalResponsesBoth(userMessage);
  const replyText = preferredLang === "tl" ? tl : en;

  return {
    replyText,
    textEn: en,
    textTl: tl,
  };
}
