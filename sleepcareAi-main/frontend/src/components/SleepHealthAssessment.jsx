import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Bot,
  ChevronLeft,
  MessageCircle,
  CheckCircle2,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getCsrfToken } from '../services/authApi';
import '../styles/chat.css';

// ---------------------------------------------------------------------------
// Exactly the 9 clinical questions (NO occupation question)
// ---------------------------------------------------------------------------
const QUESTIONS = [
  {
    id: 'difficulty_falling_asleep',
    label: 'Difficulty falling asleep',
    text: 'Do you often have difficulty falling asleep?',
  },
  {
    id: 'frequent_night_awakenings',
    label: 'Frequent night waking',
    text: 'Do you frequently wake up during the night?',
  },
  {
    id: 'early_morning_awakening',
    label: 'Waking earlier than desired',
    text: 'Do you wake up earlier than you want and struggle to fall asleep again?',
  },
  {
    id: 'daytime_sleepiness',
    label: 'Daytime tiredness / sleepiness',
    text: 'Do you often feel tired or sleepy during the daytime?',
  },
  {
    id: 'loud_snoring',
    label: 'Loud snoring',
    text: 'Have you been told that you snore loudly while sleeping?',
  },
  {
    id: 'gasping_or_choking',
    label: 'Waking gasping / choking',
    text: 'Do you ever wake up gasping, choking, or short of breath?',
  },
  {
    id: 'dry_mouth_or_sore_throat',
    label: 'Dry mouth or sore throat',
    text: 'Do you sometimes wake up with a dry mouth or sore throat?',
  },
  {
    id: 'morning_headache',
    label: 'Morning headache',
    text: 'Do you often wake up with a headache?',
  },
  {
    id: 'unrefreshing_sleep',
    label: 'Tired despite enough sleep',
    text: 'Do you feel tired even after getting what seems like enough sleep?',
  },
];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function BotAvatar() {
  return (
    <div className="sc-chat-msg-avatar" aria-hidden="true">
      <Bot size={13} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="sc-chat-msg-row bot sc-chat-typing">
      <BotAvatar />
      <div className="sc-chat-typing-bubble" aria-label="Assistant is typing">
        <span className="sc-typing-dot" />
        <span className="sc-typing-dot" />
        <span className="sc-typing-dot" />
      </div>
    </div>
  );
}

/**
 * Conversational Sleep Health Assessment Chatbot Popup
 *
 * Props:
 *   analysisId: number | null  (Linked SleepAnalysis ID from prediction results)
 *   onComplete: (assessmentId: number) => void
 */
export default function SleepHealthAssessment({
  analysisId,
  isOpen: controlledIsOpen,
  onClose,
  onComplete,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = useCallback(() => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [isControlled, onClose]);

  const handleToggle = useCallback(() => {
    if (isControlled) {
      if (isOpen && onClose) {
        onClose();
      }
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  }, [isControlled, isOpen, onClose]);

  const [currentIndex, setCurrentIndex] = useState(0); // 0 to 8: question index; 9: completed
  const [answers, setAnswers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });

  const messagesEndRef = useRef(null);

  // Initial messages
  const [messages, setMessages] = useState(() => [
    {
      id: 'bot-welcome-1',
      role: 'bot',
      text: "Hello! 👋 I'm your Sleep Assessment Assistant.",
      timestamp: Date.now(),
    },
    {
      id: 'bot-welcome-2',
      role: 'bot',
      text: 'Answer a few optional questions to add valuable sleep context to your personalized SleepCare AI report.',
      timestamp: Date.now(),
    },
    {
      id: 'bot-q-0',
      role: 'bot',
      text: QUESTIONS[0].text,
      timestamp: Date.now(),
      questionIndex: 0,
    },
  ]);

  // Auto-scroll on new message or typing state change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Restart conversation
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSaveState({ status: 'idle', message: '' });
    setIsTyping(false);
    setMessages([
      {
        id: `bot-welcome-1-${Date.now()}`,
        role: 'bot',
        text: "Hello! 👋 I'm your Sleep Assessment Assistant.",
        timestamp: Date.now(),
      },
      {
        id: `bot-welcome-2-${Date.now()}`,
        role: 'bot',
        text: 'Answer a few optional questions to add valuable sleep context to your personalized SleepCare AI report.',
        timestamp: Date.now(),
      },
      {
        id: `bot-q-0-${Date.now()}`,
        role: 'bot',
        text: QUESTIONS[0].text,
        timestamp: Date.now(),
        questionIndex: 0,
      },
    ]);
  }, []);

  // Answer question (Yes or No)
  const handleAnswer = useCallback((val) => {
    if (isTyping || currentIndex >= QUESTIONS.length) return;
    const currentQ = QUESTIONS[currentIndex];
    const userText = val === 'yes' ? 'Yes' : 'No';

    const userMsg = {
      id: `user-q-${currentIndex}-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
      questionIndex: currentIndex,
    };

    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    if (nextIndex < QUESTIONS.length) {
      setIsTyping(true);
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(() => {
        const nextQ = QUESTIONS[nextIndex];
        const botMsg = {
          id: `bot-q-${nextIndex}-${Date.now()}`,
          role: 'bot',
          text: nextQ.text,
          timestamp: Date.now(),
          questionIndex: nextIndex,
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 350);
    } else {
      // Completed all 9 questions
      setIsTyping(true);
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(() => {
        const completeMsg = {
          id: `bot-complete-${Date.now()}`,
          role: 'bot',
          text: 'Thank you! Your sleep assessment is complete. Your responses will be added as additional context to your SleepCare AI report.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, completeMsg]);
        setIsTyping(false);
      }, 400);
    }
  }, [currentIndex, isTyping]);

  // Previous button handler: rewind to previous question
  const handlePrevious = useCallback(() => {
    if (currentIndex <= 0 || isTyping) return;
    const targetIndex = currentIndex - 1;
    setCurrentIndex(targetIndex);

    setMessages((prev) => {
      // Find the bot message index for targetIndex
      const botMsgIdx = prev.findIndex((m) => m.role === 'bot' && m.questionIndex === targetIndex);
      if (botMsgIdx !== -1) {
        return prev.slice(0, botMsgIdx + 1);
      }
      return prev;
    });

    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[QUESTIONS[targetIndex].id];
      return updated;
    });
  }, [currentIndex, isTyping]);

  // Complete assessment and persist to backend
  const handleComplete = useCallback(async () => {
    if (saveState.status === 'saving' || saveState.status === 'saved') return;
    setSaveState({ status: 'saving', message: '' });

    try {
      const csrfToken = await getCsrfToken();
      const API_BASE = import.meta.env.VITE_API_URL || '';

      const payload = {
        analysis_id: analysisId || null,
        difficulty_falling_asleep: answers.difficulty_falling_asleep || 'no',
        frequent_night_awakenings: answers.frequent_night_awakenings || 'no',
        early_morning_awakening: answers.early_morning_awakening || 'no',
        daytime_sleepiness: answers.daytime_sleepiness || 'no',
        loud_snoring: answers.loud_snoring || 'no',
        gasping_or_choking: answers.gasping_or_choking || 'no',
        dry_mouth_or_sore_throat: answers.dry_mouth_or_sore_throat || 'no',
        morning_headache: answers.morning_headache || 'no',
        unrefreshing_sleep: answers.unrefreshing_sleep || 'no',
      };

      const res = await fetch(`${API_BASE}/api/assessments/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save assessment.');

      setSaveState({ status: 'saved', message: '' });
      if (onComplete) onComplete(data.id);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-saved-${Date.now()}`,
          role: 'bot',
          text: '✅ Assessment saved successfully! Your responses will now be included as additional context in your downloadable report.',
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      setSaveState({
        status: 'error',
        message: err.message || 'Could not save assessment. Please try again.',
      });
    }
  }, [analysisId, answers, saveState.status, onComplete]);

  return (
    <>
      {/* ── Floating Action Button (FAB Launcher) ────────────────────────── */}
      <button
        type="button"
        id="sc-chat-fab-btn"
        className={`sc-chat-fab ${isOpen ? 'is-open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close sleep assessment assistant' : 'Open sleep assessment assistant'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="sc-chat-fab-label" aria-hidden="true">
          {saveState.status === 'saved' ? 'Assessment Completed' : 'Sleep Assessment'}
        </span>
        {isOpen ? (
          <X size={22} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <MessageCircle size={24} strokeWidth={2} aria-hidden="true" />
        )}
      </button>

      {/* ── Conversational Chatbot Window Popup ─────────────────────────── */}
      {isOpen && (
        <div
          className="sc-chat-window"
          role="dialog"
          aria-modal="false"
          aria-label="SleepCare AI Sleep Assessment Assistant"
          aria-labelledby="sc-chat-title"
        >
          {/* Header */}
          <div className="sc-chat-header">
            <div className="sc-chat-header-avatar" aria-hidden="true">
              <Bot size={18} />
            </div>
            <div className="sc-chat-header-info">
              <p className="sc-chat-header-title" id="sc-chat-title">SleepCare AI</p>
              <div className="sc-chat-header-status">
                <span className="sc-chat-status-dot" aria-hidden="true" />
                <span>Sleep Assessment Assistant</span>
              </div>
            </div>

            {/* Restart icon */}
            <button
              type="button"
              className="sc-chat-restart-btn"
              onClick={handleRestart}
              aria-label="Restart assessment"
              title="Restart"
              id="sc-chat-restart-btn"
            >
              <RotateCcw size={14} aria-hidden="true" />
            </button>

            {/* Close icon */}
            <button
              type="button"
              className="sc-chat-close-btn"
              onClick={handleClose}
              aria-label="Close chat"
              title="Close"
              id="sc-chat-close-btn"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          {/* ── Scrollable Conversation Messages Area ───────────────────── */}
          <div
            className="sc-chat-messages"
            role="log"
            aria-live="polite"
            aria-label="Assessment conversation"
          >
            <div className="sc-chat-date-sep" aria-hidden="true">
              Today
            </div>

            {messages.map((msg) => {
              const isBot = msg.role === 'bot';
              return (
                <div key={msg.id} className={`sc-chat-msg-row ${msg.role}`}>
                  {isBot && <BotAvatar />}
                  <div className="sc-chat-msg-col">
                    <div className="sc-chat-bubble">
                      <p className="sc-bubble-text">{msg.text}</p>
                    </div>
                    <p className="sc-chat-bubble-time">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              );
            })}

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* ── Fixed Bottom Controls (Horizontal Side-by-Side Yes/No) ──── */}
          <div className="sc-assess-bottom" id="sc-chat-bottom-controls">
            {currentIndex < QUESTIONS.length ? (
              <>
                {/* Navigation & Progress Row */}
                <div className="sc-assess-nav-row">
                  {currentIndex > 0 ? (
                    <button
                      type="button"
                      id="sc-chat-prev-btn"
                      className="sc-assess-prev-btn"
                      onClick={handlePrevious}
                      disabled={isTyping}
                      aria-label="Return to previous question"
                    >
                      <ChevronLeft size={14} aria-hidden="true" />
                      <span>Previous</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="sc-chat-progress-pill">
                    Question {currentIndex + 1} of {QUESTIONS.length}
                  </span>
                </div>

                {/* Normal Horizontal Side-by-Side Yes / No Buttons */}
                <div className="sc-assess-yesno-wrap" id="sc-chat-yesno-row">
                  <button
                    type="button"
                    id="sc-chat-yes-btn"
                    className={`sc-assess-yesno-btn yes ${answers[QUESTIONS[currentIndex]?.id] === 'yes' ? 'selected' : ''}`}
                    onClick={() => handleAnswer('yes')}
                    disabled={isTyping}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    id="sc-chat-no-btn"
                    className={`sc-assess-yesno-btn no ${answers[QUESTIONS[currentIndex]?.id] === 'no' ? 'selected' : ''}`}
                    onClick={() => handleAnswer('no')}
                    disabled={isTyping}
                  >
                    No
                  </button>
                </div>
              </>
            ) : saveState.status !== 'saved' ? (
              /* All 9 questions answered: Complete Assessment */
              <div className="sc-assess-complete-wrap">
                {saveState.status === 'error' && (
                  <div className="sc-chat-error-callout" role="alert">
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{saveState.message}</span>
                  </div>
                )}
                <div className="sc-assess-complete-btns">
                  <button
                    type="button"
                    className="sc-assess-prev-btn"
                    onClick={handlePrevious}
                    disabled={saveState.status === 'saving'}
                    aria-label="Previous question"
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    id="sc-chat-complete-btn"
                    className="sc-chat-complete-btn"
                    onClick={handleComplete}
                    disabled={saveState.status === 'saving'}
                    aria-busy={saveState.status === 'saving'}
                  >
                    {saveState.status === 'saving' ? (
                      <>
                        <Loader2 size={16} className="sc-chat-spin" aria-hidden="true" />
                        <span>Saving Assessment...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} aria-hidden="true" />
                        <span>Complete Assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Saved & Done confirmation */
              <div className="sc-assess-done-wrap">
                <div className="sc-chat-saved-notice">
                  <CheckCircle2 size={16} className="sc-chat-saved-icon" aria-hidden="true" />
                  <span>Assessment Saved & Linked to Report</span>
                </div>
                <button
                  type="button"
                  id="sc-chat-close-window-btn"
                  className="sc-chat-close-window-btn"
                  onClick={handleClose}
                >
                  Close Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
