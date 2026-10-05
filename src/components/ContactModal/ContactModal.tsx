import React, { useState } from "react";
import { createPortal } from "react-dom";
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

  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT;

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
    setSubmissionStatus("Submitting...");

    // Production submission flow
    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            message: formData.message,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          setSubmissionStatus(
            "Message sent successfully. Thank you for reaching out.",
          );
          setFormData({ name: "", email: "", message: "" });
          setErrors({});
          setTimeout(() => {
            onClose();
            setSubmissionStatus(null);
          }, 1800);
        } else {
          setSubmissionStatus(
            "Submission failed. Falling back to email client...",
          );
          launchMailtoFallback();
        }
      } catch {
        setSubmissionStatus("Network issue. Opening default email client...");
        launchMailtoFallback();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Deterministic graceful fallback per spec
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

    setSubmissionStatus(
      "Launching default mail client with formatted draft...",
    );
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

        {/* Honest Architecture & Fallback Disclosure per spec */}
        <div className={styles.fallbackNotice} role="note">
          <strong>Direct Transmission Notice:</strong>{" "}
          {endpoint ? (
            <span>Form will transmit to configured endpoint ({endpoint}).</span>
          ) : (
            <span>
              No external API endpoint is configured. Submitting this form opens
              your system's default email client pre-populated to send directly
              to <strong>{siteContent.meta.email}</strong>.
            </span>
          )}
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
