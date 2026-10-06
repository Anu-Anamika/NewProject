import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Bot, ChevronLeft, MessageCircle, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QUESTIONS, formatAnswerForReview } from '../services/assessmentFlow';
import { saveAssessment } from '../services/api';
import '../styles/chat.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse **bold** markdown → React nodes */
function parseMd(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BotAvatar() {
  return (
    <div className="sc-chat-msg-avatar" aria-hidden="true">
      <Bot size={13} />
    </div>
  );
}

function MessageBubble({ message }) {
  const isBot = message.role === 'bot';
  return (
    <div className={`sc-chat-msg-row ${message.role}`}>
      {isBot && <BotAvatar />}
      <div className="sc-chat-msg-col">
        <div className="sc-chat-bubble">
          <p className="sc-bubble-text">{parseMd(message.text)}</p>
        </div>
        <p className="sc-chat-bubble-time">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="sc-chat-msg-row bot sc-chat-typing">
      <BotAvatar />
      <div className="sc-chat-typing-bubble" aria-label="Assistant is thinking">
        <span className="sc-typing-dot" />
        <span className="sc-typing-dot" />
        <span className="sc-typing-dot" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Card — shown at the end
// ---------------------------------------------------------------------------
function ReviewCard({ answers }) {
  return (
    <div className="sc-review-card">
      <div className="sc-review-header">
        <CheckCircle2 size={15} className="sc-review-icon" />
        <span>Your Sleep Assessment</span>
      </div>
      <div className="sc-review-list">
        {QUESTIONS.map((q) => {
          const raw = answers[q.id];
          if (raw === undefined || raw === null || raw === '') return null;
          return (
            <div key={q.id} className="sc-review-row">
              <span className="sc-review-label">{q.label}</span>
              <span className="sc-review-value">{formatAnswerForReview(q, raw)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input area — changes by question type
// ---------------------------------------------------------------------------
function AssessmentInput({ question, inputValue, setInputValue, onAnswer, onPrevious, canGoBack, isTyping, inputRef }) {
  const handleTextSubmit = (e) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;

    if (question.type === 'number') {
      const num = parseInt(trimmed, 10);
      if (isNaN(num) || num < (question.min || 1) || num > (question.max || 120)) return;
      onAnswer(num, String(num));
    } else {
      onAnswer(trimmed, trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
  };

  const isSelectType = question.type === 'yesno' || question.type === 'options';

  return (
    <div className="sc-assess-bottom">
      {/* Previous button row */}
      {canGoBack && (
        <div className="sc-assess-prev-row">
          <button
            type="button"
            className="sc-assess-prev-btn"
            onClick={onPrevious}
            aria-label="Go to previous question"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            <span>Previous</span>
          </button>
        </div>
      )}

      {/* Yes / No */}
      {question.type === 'yesno' && (
        <div className="sc-assess-yesno-wrap">
          <button
            type="button"
            className="sc-assess-yesno-btn yes"
            onClick={() => onAnswer('yes', 'Yes')}
            disabled={isTyping}
            id="sc-assess-btn-yes"
          >
            Yes
          </button>
          <button
            type="button"
            className="sc-assess-yesno-btn no"
            onClick={() => onAnswer('no', 'No')}
            disabled={isTyping}
            id="sc-assess-btn-no"
          >
            No
          </button>
        </div>
      )}

      {/* Option grid */}
      {question.type === 'options' && (
        <div
          className={`sc-assess-options-grid ${question.columns === 2 ? 'cols-2' : 'cols-1'}`}
          role="group"
          aria-label={`Options for: ${question.question}`}
        >
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="sc-assess-option-btn"
              onClick={() => onAnswer(opt, opt)}
              disabled={isTyping}
              id={`sc-opt-${opt.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Text / Number input */}
      {!isSelectType && (
        <form className="sc-chat-input-area" onSubmit={handleTextSubmit} aria-label="Answer input">
          <input
            ref={inputRef}
            type={question.type === 'number' ? 'number' : 'text'}
            className="sc-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={question.placeholder || 'Type your answer…'}
            min={question.min}
            max={question.max}
            disabled={isTyping}
            aria-label={question.question}
            id="sc-assess-text-input"
          />
          <button
            type="submit"
            className="sc-chat-send-btn"
            disabled={!inputValue.trim() || isTyping}
            aria-label="Submit answer"
            id="sc-assess-send-btn"
          >
            <Send size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatWidget
// ---------------------------------------------------------------------------
export default function ChatWidget() {
  const [isOpen, setIsOpen]                     = useState(false);
  const [phase, setPhase]                       = useState('welcome'); // 'welcome' | 'assessment' | 'review'
  const [stepIndex, setStepIndex]               = useState(0);
  const [answers, setAnswers]                   = useState({});
  const [messages, setMessages]                 = useState([]);
  const [completionCounts, setCompletionCounts] = useState([]); // messages added per step completion
  const [inputValue, setInputValue]             = useState('');
  const [isTyping, setIsTyping]                 = useState(false);
  const [showReview, setShowReview]             = useState(false);
  // 'idle' | 'saving' | 'error'
  const [submitState, setSubmitState]           = useState({ status: 'idle', message: '' });

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const navigate       = useNavigate();

  const currentQuestion = phase === 'assessment' ? QUESTIONS[stepIndex] : null;
  const canGoBack       = phase === 'assessment' && stepIndex > 0 && completionCounts.length > 0;

  // ── Scroll to bottom on new content ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const el = messagesEndRef.current;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, phase, showReview]);

  // ── Auto-focus text/number input ─────────────────────────────────────────
  useEffect(() => {
    if (
      isOpen &&
      phase === 'assessment' &&
      currentQuestion &&
      currentQuestion.type !== 'yesno' &&
      currentQuestion.type !== 'options'
    ) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, phase, stepIndex, currentQuestion]);

  // ── Escape key closes window ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // ── Start Assessment ──────────────────────────────────────────────────────
  const handleStartAssessment = useCallback(async () => {
    setPhase('assessment');
    setStepIndex(0);
    setMessages([]);
    setCompletionCounts([]);
    setAnswers({});
    setInputValue('');
    setShowReview(false);

    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 650));
    setIsTyping(false);

    setMessages([
      {
        id: `bot-q0-${Date.now()}`,
        role: 'bot',
        text: QUESTIONS[0].question,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // ── Handle Answer ─────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    async (rawValue, displayLabel) => {
      if (isTyping) return;

      const question  = QUESTIONS[stepIndex];
      const nextIndex = stepIndex + 1;
      const isLast    = nextIndex >= QUESTIONS.length;

      // Persist answer
      setAnswers((prev) => ({ ...prev, [question.id]: rawValue }));
      setInputValue('');

      // Immediately show user bubble
      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: displayLabel,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Typing indicator
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 350));
      setIsTyping(false);

      if (!isLast) {
        const nextQ   = QUESTIONS[nextIndex];
        const botMsgs = [];

        // Transition preamble (e.g. "😴 Let's talk about your sleep.")
        if (nextQ.preamble) {
          botMsgs.push({
            id: `bot-pre-${Date.now()}-${nextIndex}`,
            role: 'bot',
            text: nextQ.preamble,
            timestamp: Date.now(),
          });
        }

        // Next question bubble
        botMsgs.push({
          id: `bot-q${nextIndex}-${Date.now()}`,
          role: 'bot',
          text: nextQ.question,
          timestamp: Date.now(),
        });

        setMessages((prev) => [...prev, ...botMsgs]);
        // Track: 1 user bubble + however many bot msgs were added
        setCompletionCounts((prev) => [...prev, 1 + botMsgs.length]);
        setStepIndex(nextIndex);
      } else {
        // All questions answered — thank you message
        const thankMsg = {
          id: `bot-thanks-${Date.now()}`,
          role: 'bot',
          text: "Thank you! I've collected your sleep information. 🌟\n\nPlease review your answers before continuing.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, thankMsg]);
        setCompletionCounts((prev) => [...prev, 2]); // user + thank = 2
        setPhase('review');
      }
    },
    [isTyping, stepIndex]
  );

  // ── Go Back ───────────────────────────────────────────────────────────────
  const handlePrevious = useCallback(() => {
    if (!canGoBack) return;

    const lastCount = completionCounts[completionCounts.length - 1];
    setMessages((prev) => prev.slice(0, prev.length - lastCount));
    setCompletionCounts((prev) => prev.slice(0, -1));

    const prevIdx = stepIndex - 1;
    setStepIndex(prevIdx);

    // Pre-fill previous answer for text/number inputs
    const prevQ = QUESTIONS[prevIdx];
    if (prevQ.type === 'text' || prevQ.type === 'number') {
      setInputValue(String(answers[prevQ.id] ?? ''));
    } else {
      setInputValue('');
    }
  }, [canGoBack, completionCounts, stepIndex, answers]);

  // ── Restart ───────────────────────────────────────────────────────────────
  const handleRestart = () => {
    setPhase('welcome');
    setStepIndex(0);
    setMessages([]);
    setCompletionCounts([]);
    setAnswers({});
    setInputValue('');
    setShowReview(false);
    setSubmitState({ status: 'idle', message: '' });
  };

  // ── Save assessment + navigate ────────────────────────────────────────────
  const handleContinue = useCallback(async () => {
    if (submitState.status === 'saving') return;
    setSubmitState({ status: 'saving', message: '' });
    try {
      const result = await saveAssessment(answers);
      // Navigate to prediction page with assessment ID in the URL as specified
      navigate(`/prediction/${result.id}`);
      setIsOpen(false);
    } catch (err) {
      setSubmitState({
        status: 'error',
        message: err.message || 'Something went wrong. Please try again.',
      });
    }
  }, [answers, submitState.status, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Action Button ──────────────────────────────────────── */}
      <button
        type="button"
        id="sc-chat-fab-btn"
        className={`sc-chat-fab ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close sleep assessment' : 'Open sleep assessment'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="sc-chat-fab-label" aria-hidden="true">Chat with SleepCare AI</span>
        {isOpen
          ? <X size={22} strokeWidth={2.5} aria-hidden="true" />
          : <MessageCircle size={24} strokeWidth={2} aria-hidden="true" />
        }
      </button>

      {/* ── Chat Window ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="sc-chat-window"
          role="dialog"
          aria-modal="false"
          aria-label="SleepCare AI Sleep Assessment"
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
            {phase !== 'welcome' && (
              <button
                type="button"
                className="sc-chat-restart-btn"
                onClick={handleRestart}
                aria-label="Restart assessment"
                title="Restart"
                id="sc-chat-restart-btn"
              >
                ↺
              </button>
            )}
            <button
              type="button"
              className="sc-chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              id="sc-chat-close-btn"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          {/* ── Messages area ──────────────────────────────────────────── */}
          <div
            className="sc-chat-messages"
            role="log"
            aria-live="polite"
            aria-label="Assessment conversation"
          >
            {/* Date stamp */}
            <div className="sc-chat-date-sep" aria-hidden="true">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>

            {/* ── Welcome Phase ─────────────────────────────────────── */}
            {phase === 'welcome' && (
              <div className="sc-assess-welcome-block">
                <div className="sc-chat-msg-row bot">
                  <BotAvatar />
                  <div className="sc-chat-msg-col">
                    <div className="sc-chat-bubble sc-welcome-bubble">
                      <p>Hi! I'll ask you a few simple questions about your sleep. 🌙</p>
                      <p className="sc-welcome-line">Your answers will be saved as a sleep assessment.</p>
                      <p className="sc-welcome-line"><strong>Let's get started.</strong></p>
                    </div>
                    <p className="sc-chat-bubble-time">{formatTime(Date.now())}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Assessment & Review — conversation history ─────────── */}
            {phase !== 'welcome' && messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Review expandable card */}
            {phase === 'review' && showReview && (
              <ReviewCard answers={answers} />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* ── Bottom interactive area ─────────────────────────────── */}

          {/* Welcome: Start button */}
          {phase === 'welcome' && (
            <div className="sc-assess-start-area">
              <button
                type="button"
                className="sc-assess-start-btn"
                onClick={handleStartAssessment}
                id="sc-assess-start-btn"
                disabled={isTyping}
              >
                <span>Start Assessment</span>
                <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Assessment: question-specific input */}
          {phase === 'assessment' && currentQuestion && (
            <AssessmentInput
              question={currentQuestion}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onAnswer={handleAnswer}
              onPrevious={handlePrevious}
              canGoBack={canGoBack}
              isTyping={isTyping}
              inputRef={inputRef}
            />
          )}

          {/* Review: summary + action buttons */}
          {phase === 'review' && (
            <div className="sc-assess-review-footer">
              <button
                type="button"
                className={`sc-assess-review-toggle ${showReview ? 'active' : ''}`}
                onClick={() => setShowReview((p) => !p)}
                id="sc-review-toggle-btn"
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>{showReview ? 'Hide Answers' : 'Review Answers'}</span>
              </button>

              {/* Error banner */}
              {submitState.status === 'error' && (
                <div className="sc-assess-submit-error" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{submitState.message}</span>
                </div>
              )}

              <button
                type="button"
                className="sc-assess-continue-btn"
                onClick={handleContinue}
                disabled={submitState.status === 'saving'}
                id="sc-review-continue-btn"
                aria-busy={submitState.status === 'saving'}
              >
                {submitState.status === 'saving' ? (
                  <><Loader2 size={15} className="sc-spin" aria-hidden="true" /><span>Saving…</span></>
                ) : (
                  <><span>Continue to Sleep Prediction</span><ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
