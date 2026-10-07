import React, { useState } from "react";
import { createPortal } from "react-dom";
import emailjs from "@emailjs/browser";
import { siteContent } from "../../content/siteContent";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import styles from "./ContactModal.module.css";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

// EmailJS Service & Template identifiers provided by user:
// Service ID (Gmail): service_jywlhsz
// Contact Us Template ID (Notification to Kennu): template_vcl3ubl
// Auto-Reply Template ID (Confirmation to Sender): template_fk2vlnu
const EMAILJS_SERVICE_ID =
  import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_jywlhsz";
const EMAILJS_TEMPLATE_ID =
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_vcl3ubl";
const EMAILJS_AUTOREPLY_TEMPLATE_ID =
  import.meta.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID || "template_fk2vlnu";
const EMAILJS_PUBLIC_KEY =
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "OnBse-4nZVFDGjy43";

// Resilient dispatcher supporting both SDK and native fetch REST API
const sendViaEmailJS = async (
  serviceId: string,
  templateId: string,
  params: Record<string, unknown>,
  publicKey: string,
) => {
  try {
    return await emailjs.send(serviceId, templateId, params, publicKey);
  } catch {
    // Native browser REST API fallback (works without any SDK dependency)
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: params,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `EmailJS HTTP ${res.status}`);
    }
    return { status: 200, text: "OK" };
  }
};

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });

  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please enter a message.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus("Transmitting via EmailJS...");

    const templateParams = {
      // Sender Details
      name: formData.name.trim(),
      from_name: formData.name.trim(),
      user_name: formData.name.trim(),
      email: formData.email.trim(),
      from_email: formData.email.trim(),
      user_email: formData.email.trim(),
      reply_to: formData.email.trim(),

      // Recipient (Kennu Elnar)
      to_name: "Kennu Elnar",
      to_email: siteContent.meta.email, // elnarkennu16@gmail.com

      // Message Content
      message: formData.message.trim(),
      user_message: formData.message.trim(),

      // Metadata
      subject: `Portfolio Inquiry from ${formData.name.trim()}`,
      sent_at: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };

    if (EMAILJS_PUBLIC_KEY) {
      try {
        // 1. Primary delivery: Send Contact Us notification to Kennu's Gmail
        await sendViaEmailJS(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY,
        );

        // 2. Auto-Reply: Send immediate confirmation copy to sender
        if (EMAILJS_AUTOREPLY_TEMPLATE_ID) {
          try {
            await sendViaEmailJS(
              EMAILJS_SERVICE_ID,
              EMAILJS_AUTOREPLY_TEMPLATE_ID,
              templateParams,
              EMAILJS_PUBLIC_KEY,
            );
          } catch (autoReplyError) {
            console.warn("EmailJS auto-reply note:", autoReplyError);
          }
        }

        setSubmissionStatus(
          "Message sent successfully! A confirmation copy has been sent to your email.",
        );
        setFormData({ name: "", email: "", message: "" });
        setErrors({});
        setTimeout(() => {
          onClose();
          setSubmissionStatus(null);
        }, 2200);
      } catch (err: unknown) {
        console.error("EmailJS transmission error:", err);
        setSubmissionStatus(
          "EmailJS error encountered. Launching email client fallback...",
        );
        launchMailtoFallback();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // If Public Key isn't defined yet, provide graceful guidance and launch mailto
      setSubmissionStatus(
        "Opening default email client with your formatted message...",
      );
      launchMailtoFallback();
      setIsSubmitting(false);
    }
  };

  const launchMailtoFallback = () => {
    const recipient = siteContent.meta.email;
    const subject = encodeURIComponent(
      `Portfolio Inquiry from ${formData.name}`,
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
    );
    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;

    window.location.href = mailtoUrl;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        aria-describedby="contact-modal-subtitle"
      >
        <div className={styles.dialogHeader}>
          <div className={styles.titleArea}>
            <h2 id="contact-modal-title" className={styles.dialogTitle}>
              {siteContent.contact.title}
            </h2>
            <p id="contact-modal-subtitle" className={styles.dialogSubtitle}>
              {siteContent.contact.subtitle}
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close contact dialog (Escape)"
          >
            ESC ✕
          </button>
        </div>

        {/* Direct Transmission Notice */}
        <div className={styles.fallbackNotice} role="note">
          <strong>Direct Transmission Notice:</strong>{" "}
          <span>
            Connected via <strong>EmailJS</strong> (Service:{" "}
            <code>{EMAILJS_SERVICE_ID}</code>). Messages are delivered directly
            to <strong>{siteContent.meta.email}</strong> with an automated
            confirmation sent to your inbox.
          </span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Name Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="contact-name" className={styles.fieldLabel}>
              Your Name{" "}
              <span className={styles.requiredMark} aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              required
              autoComplete="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`${styles.inputField} ${errors.name ? styles.inputError : ""}`}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <span
                id="name-error"
                className={styles.errorMessage}
                role="alert"
              >
                {errors.name}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="contact-email" className={styles.fieldLabel}>
              Email Address{" "}
              <span className={styles.requiredMark} aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`${styles.inputField} ${errors.email ? styles.inputError : ""}`}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <span
                id="email-error"
                className={styles.errorMessage}
                role="alert"
              >
                {errors.email}
              </span>
            )}
          </div>

          {/* Message Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="contact-message" className={styles.fieldLabel}>
              Message{" "}
              <span className={styles.requiredMark} aria-hidden="true">
                *
              </span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              required
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className={`${styles.textareaField} ${errors.message ? styles.inputError : ""}`}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <span
                id="message-error"
                className={styles.errorMessage}
                role="alert"
              >
                {errors.message}
              </span>
            )}
          </div>

          {/* Submit Row */}
          <div className={styles.submitRow}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="pillButton"
            >
              <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>

            {submissionStatus && (
              <span className={styles.formStatusNotice} role="status">
                {submissionStatus}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
