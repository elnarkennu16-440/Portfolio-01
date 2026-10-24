import React, { useState, useRef, useEffect } from "react";
import { Send, X, RotateCcw } from "lucide-react";
import styles from "./Chatbot.module.css";
import {
  generateChatbotReply,
  translateBotResponseText,
} from "../../utils/chatbotEngine";
import { siteContent } from "../../content/siteContent";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  textEn?: string;
  textTl?: string;
}

const QUICK_PROMPTS_EN = [
  {
    label: "About Kennu Elnar?",
    query: "Tell me about yourself and your background",
  },
  {
    label: "Projects Developed",
    query: "What projects have you developed and tested?",
  },
  {
    label: "Technical Tools and Skills",
    query: "What are your technical tools and skills?",
  },
  {
    label: "Project Architecture?",
    query:
      "How do you setup fullstack project structures and its architecture?",
  },
  {
    label: "Message me",
    query: "How do I get in touch with you or hire you?",
  },
];

const QUICK_PROMPTS_TL = [
  {
    label: "Tungkol kay Kennu Elnar",
    query: "Pakilala ka at ano ang iyong background?",
  },
  {
    label: "Mga prokyektong ginawa",
    query: "Ano ang mga proyektong ginawa at sinuri mo?",
  },
  {
    label: "Mga kasanayan at teknikal na tools",
    query: "Ano ang mga kasanayan at teknikal na tools mo?",
  },
  {
    label: "Proyektong Arkitektura",
    query: "Paano mo itinayo ang fullstack project structures at architecture?",
  },
  {
    label: "iDownload ang CV",
    query: "Saan ko pwedeng i-download ang resume o CV mo?",
  },
  {
    label: "Makipag-ugnayan",
    query: "Paano makikipag-ugnayan o mag-hire sa iyo?",
  },
];

const INITIAL_GREETING_EN =
  "Hello! I am an autonomous AI assistant for Kennu Elnar's portfolio. My responses are limited and based strictly on his provided information. Feel free to look around and ask me about his background, projects, skills, or tech stack. Whether you have questions, feedback, or ideas to share, don't hesitate to reach out. You're welcome to ask in either English or Tagalog!";

const INITIAL_GREETING_TL =
  "Kamusta! Ako ang autonomous AI assistant para sa portfolio ni Kennu Elnar. Ang aking mga sagot ay limitado at nakabatay lamang sa impormasyong ibinigay niya. Huwag mag-atubiling magtanong tungkol sa kanyang background, mga proyekto, kasanayan, o tech stacks. Kung may mga katanungan, puna, o ideya kang nais ibahagi, huwag mag-atubiling makipag-ugnayan. Maaari kang magtanong sa Ingles o Tagalog!";

interface FloatingQuestion {
  id: string;
  number: string;
  labelEn: string;
  labelTl: string;
  queryEn: string;
  queryTl: string;
}

const FLOATING_QUESTIONS: FloatingQuestion[] = [
  {
    id: "thoughts-on-ai-tools",
    number: "①",
    labelEn: "ᴛʜᴏᴜɢʜᴛꜱ ᴏɴ ᴀɪ?",
    labelTl: "ᴘᴀɴᴀɴᴀᴡ ꜱᴀ ᴀɪ?",
    queryEn: "What are your thoughts on AI tools and coding assistants?",
    queryTl: "Ano ang pananaw mo sa mga AI tools at coding assistants?",
  },
  {
    id: "advice-bsis-it-cs",
    number: "②",
    labelEn: "ᴘɪᴇᴄᴇ ᴏꜰ ᴀᴅᴠɪᴄᴇ ꜰᴏʀ ᴀꜱᴘɪʀɪɴɢ ʙꜱɪꜱ, ʙꜱɪᴛ, ʙꜱᴄꜱ?",
    labelTl: "ᴘᴀʏᴏ ᴘᴀʀᴀ ꜱᴀ ᴍɢᴀ ᴀꜱᴘɪʀɪɴɢ ɴᴀ ʙꜱɪꜱ, ʙꜱɪᴛ, ʙꜱᴄꜱ?",
    queryEn:
      "What advice do you have for aspiring BSIS, BSIT, or BSCS students?",
    queryTl: "Anong payo mo para sa mga aspiring BSIS, BSIT, o BSCS students?",
  },
  {
    id: "learn-technologies",
    number: "③",
    labelEn: "ʜᴏᴡ ᴅᴏ ʏᴏᴜ ʟᴇᴀʀɴ ɴᴇᴡ ᴛᴇᴄʜɴᴏʟᴏɢɪᴇꜱ ᴀɴᴅ ᴛᴏᴏʟꜱ?",
    labelTl: "ᴘᴀᴀɴᴏ ᴋᴀ ᴍᴀᴛᴜᴛᴏ ɴɢ ʙᴀɢᴏɴɢ ᴛᴇᴄʜɴᴏʟᴏɢɪᴇꜱ ᴀᴛ ᴛᴏᴏʟꜱ?",
    queryEn: "How do you learn new technologies, frameworks, and tools?",
    queryTl: "Paano ka nag-aaral at natututo ng bagong technologies at tools?",
  },
  {
    id: "daily-motivation",
    number: "④",
    labelEn: "ᴅᴀɪʟʏ ᴍᴏᴛɪᴠᴀᴛɪᴏɴ?",
    labelTl: "ᴘᴀɴɢ-ᴀʀᴀᴡ-ᴀʀᴀᴡ ɴᴀ ɪɴꜱᴘɪʀᴀꜱʏᴏɴ?",
    queryEn: "What is your daily motivation and mindset?",
    queryTl:
      "Ano ang nagmo-motivate sa iyo araw-araw at ang iyong inspirasyon?",
  },
];

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "tl">("en");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      sender: "bot",
      text: INITIAL_GREETING_EN,
      textEn: INITIAL_GREETING_EN,
      textTl: INITIAL_GREETING_TL,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const switchLanguage = (targetLang: "en" | "tl") => {
    if (language === targetLang) return;
    setLanguage(targetLang);

    // Automatically switch ALL bot responses in the chat history to the selected language
    // The user's asked questions (sender === 'user') are strictly preserved untouched!
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.sender === "bot") {
          let updatedText = msg.text;
          if (targetLang === "tl") {
            updatedText =
              msg.textTl || translateBotResponseText(msg.text, "tl");
          } else {
            updatedText =
              msg.textEn || translateBotResponseText(msg.text, "en");
          }
          return {
            ...msg,
            text: updatedText,
          };
        }
        // User questions are untouched
        return msg;
      }),
    );
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "tl" : "en";
    switchLanguage(nextLang);
  };

  const handleResetChat = () => {
    if (isResetting) return;
    setIsResetting(true);
    setIsClearing(true);

    // Smooth minimalist animation: slowly clean messages with graceful fade, then restore fresh greeting
    setTimeout(() => {
      setMessages([
        {
          id: `initial-${Date.now()}`,
          sender: "bot",
          text: language === "tl" ? INITIAL_GREETING_TL : INITIAL_GREETING_EN,
          textEn: INITIAL_GREETING_EN,
          textTl: INITIAL_GREETING_TL,
        },
      ]);
      setInputValue("");
      setIsTyping(false);
      setIsClearing(false);
    }, 280);

    setTimeout(() => {
      setIsResetting(false);
    }, 650);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Natural typing delay for realistic response feel
      await new Promise((res) => setTimeout(res, 600));

      const { replyText, textEn, textTl } = await generateChatbotReply(
        query,
        messages.map((m) => ({ sender: m.sender, text: m.text })),
        language,
      );

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        textEn,
        textTl,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errEn =
        "A system exception occurred while processing the request. You may retry your query or route direct correspondence to elnarkennu16@gmail.com.";
      const errTl =
        "Nagkaroon ng sistemikong aberya sa pagproseso ng katanungan. Maaari mong ulitin ang iyong tanong o direktang makipag-ugnayan sa elnarkennu16@gmail.com.";
      const fallbackMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: language === "tl" ? errTl : errEn,
        textEn: errEn,
        textTl: errTl,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = language === "tl" ? QUICK_PROMPTS_TL : QUICK_PROMPTS_EN;

  return (
    <div className={styles.chatbotContainer} aria-label="Portfolio Chatbot">
      {/* Floating Messenger Window */}
      {isOpen && (
        <div
          className={styles.chatWindow}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Kennu"
        >
          {/* Header: Clean & Minimalist (No cluttered subtitle) */}
          <div className={styles.chatHeader}>
            <div className={styles.headerProfile}>
              <img
                src={siteContent.meta.portraitUrl}
                alt="Kennu Elnar"
                className={styles.headerAvatar}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    siteContent.meta.cutoutUrl;
                }}
              />
              <span className={styles.headerName}>Kennu Elnar</span>
            </div>

            <div className={styles.headerActions}>
              {/* Language Switch Animated Toggle */}
              <div
                className={styles.langToggleSwitch}
                role="radiogroup"
                aria-label="Language selection"
              >
                {/* Sliding indicator */}
                <span
                  className={`${styles.langIndicator} ${
                    language === "en"
                      ? styles.langIndicatorEn
                      : styles.langIndicatorTl
                  }`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className={`${styles.langSegment} ${
                    language === "tl" ? styles.langSegmentActive : ""
                  }`}
                  onClick={() => switchLanguage("tl")}
                  title="Switch to Tagalog (TL)"
                  aria-label="Switch to Tagalog"
                  aria-checked={language === "tl"}
                  role="radio"
                >
                  TL
                </button>
                <button
                  type="button"
                  className={`${styles.langSegment} ${
                    language === "en" ? styles.langSegmentActive : ""
                  }`}
                  onClick={() => switchLanguage("en")}
                  title="Switch to English (EN)"
                  aria-label="Switch to English"
                  aria-checked={language === "en"}
                  role="radio"
                >
                  EN
                </button>
              </div>

              {/* Refresh / Reset Chat Button */}
              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleResetChat}
                title={
                  language === "tl"
                    ? "I-reset o linisin ang usapan"
                    : "Reset / Clean chat"
                }
                aria-label="Reset chat responses"
                disabled={isResetting}
              >
                <RotateCcw
                  size={14}
                  className={`${styles.refreshIcon} ${isResetting ? styles.spinningIcon : ""}`}
                />
              </button>

              {/* Close Button */}
              <button
                type="button"
                className={styles.closeButton}
                onClick={toggleOpen}
                aria-label="Close Chat Window"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div
            className={`${styles.messagesContainer} ${
              isClearing ? styles.messagesClearing : ""
            }`}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${
                  msg.sender === "user" ? styles.user : styles.bot
                }`}
              >
                <div className={styles.messageBubble}>{msg.text}</div>
              </div>
            ))}

            {/* Floating Starter Questions directly below initial greeting */}
            {messages.length === 1 && !isTyping && (
              <div
                className={styles.floatingQuestionsList}
                aria-label="Popular questions"
              >
                {FLOATING_QUESTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.floatingQuestionButton}
                    onClick={() =>
                      handleSend(
                        language === "tl" ? item.queryTl : item.queryEn,
                      )
                    }
                    disabled={isTyping}
                  >
                    <span
                      className={styles.floatingQuestionNumber}
                      aria-hidden="true"
                    >
                      {item.number}
                    </span>
                    <span className={styles.floatingQuestionText}>
                      {language === "tl" ? item.labelTl : item.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className={`${styles.messageRow} ${styles.bot}`}>
                <div className={styles.typingIndicator}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions / Question Pills */}
          <div
            className={styles.quickPillsRow}
            aria-label="Suggested questions"
          >
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.quickPill}
                onClick={() => handleSend(item.query)}
                disabled={isTyping}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            className={styles.inputForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className={styles.inputField}
              placeholder={
                language === "tl"
                  ? "Magtanong tungkol kay Kennu..."
                  : "Ask anything about Kennu..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Chat Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          className={styles.launcherButton}
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-label="Open chat with Kennu Elnar"
        >
          <div className={styles.floatingBadge} aria-hidden="true">
            <svg
              className={styles.floatingBadgeIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 19H8C4 19 2 17 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.11 19.15 8.81 19 8.5 19Z"
                fill="#ffffff"
              />
              <circle cx="7.5" cy="10.5" r="1.35" fill="#18181b" />
              <circle cx="12" cy="10.5" r="1.35" fill="#18181b" />
              <circle cx="16.5" cy="10.5" r="1.35" fill="#18181b" />
            </svg>
          </div>

          <img
            src={siteContent.meta.portraitUrl}
            alt="Kennu Elnar"
            className={styles.launcherAvatar}
            onError={(e) => {
              (e.target as HTMLImageElement).src = siteContent.meta.cutoutUrl;
            }}
          />
        </button>
      )}
    </div>
  );
};
