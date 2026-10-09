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
    label: "About Kennu",
    query: "Tell me about Kennu Elnar and his background",
  },
  {
    label: "QA & Skills",
    query: "What are Kennu's QA testing skills and tools?",
  },
  { label: "Projects", query: "What projects has Kennu developed and tested?" },
  { label: "Download CV", query: "How can I download Kennu's resume or CV?" },
  {
    label: "Contact / Hire",
    query: "How do I get in touch with Kennu or hire him?",
  },
];

const QUICK_PROMPTS_TL = [
  {
    label: "Tungkol kay Kennu",
    query: "Sino si Kennu Elnar at ano ang kanyang background?",
  },
  {
    label: "QA at Kasanayan",
    query: "Ano ang mga QA testing skills at tools ni Kennu?",
  },
  {
    label: "Mga Proyekto",
    query: "Ano ang mga proyektong ginawa at sinuri ni Kennu?",
  },
  {
    label: "Download CV",
    query: "Paano ko mada-download ang CV o resume ni Kennu?",
  },
  {
    label: "Makipag-ugnayan",
    query: "Paano makikipag-ugnayan o mag-hire kay Kennu?",
  },
];

const INITIAL_GREETING_EN =
  "I am the autonomous AI assistant for Kennu Elnar's portfolio. You may submit inquiries regarding his QA methodologies, technical architectures, full-stack systems, or curriculum vitae. Inquiries are processed in English, Filipino, or Taglish.";

const INITIAL_GREETING_TL =
  "Ako ang opisyal na AI assistant para sa portfolio ni Kennu Elnar. Maaari kang sumangguni hinggil sa kanyang mga metodolohiya sa QA, arkitektura ng software, mga natapos na sistema, o curriculum vitae sa wikang Filipino, Ingles, o Taglish.";

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

              {/* Refresh / Reset Chat Button (Pointed by Red Arrow) */}
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

          {/* Messages Feed: Clean bubbles without avatar or timestamp clutter */}
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

          {/* Quick Suggestions / Question Pills (Pointed by Red Arrow) */}
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

      {/* Floating Chat Launcher Button (Visible only when chat is closed) */}
      {!isOpen && (
        <button
          type="button"
          className={styles.launcherButton}
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-label="Open chat with Kennu Elnar"
        >
          {/* Floating 3D-styled speech bubble badge with subtle floating animation */}
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
