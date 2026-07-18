'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, AlertTriangle, Bot, User, Phone } from 'lucide-react';
import { storageRepository } from '@/lib/storage';
import { UserProfile } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isHighRisk?: boolean;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  "I'm feeling the urge to scroll right now",
  "I'm really stressed and can't stop myself",
  "I completed a mission — it helped!",
  "I'm struggling to find an activity I enjoy",
];

export default function Companion() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      return storageRepository.getUserProfile();
    }
    return null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) {
      router.push('/onboarding');
      return;
    }

    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello. I'm your Reclaim companion — here to help you take one small step away from your screen. Let's keep our conversations brief so you can get back to real life quickly.\n\nWhat's on your mind?`,
      timestamp: new Date(),
    }]);
  }, [router, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    /* eslint-disable react-hooks/purity */
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    /* eslint-enable react-hooks/purity */

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const history = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, messages: history }),
      });

      if (response.ok) {
        const data = await response.json();
        /* eslint-disable react-hooks/purity */
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: data.content,
          isHighRisk: data.isHighRisk,
          timestamp: new Date(),
        };
        /* eslint-enable react-hooks/purity */
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (e) {
      console.error(e);
      /* eslint-disable react-hooks/purity */
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: 'I had trouble connecting. Let’s pause, take a deep breath, and try again when you are ready.',
          timestamp: new Date(),
        },
      ]);
      /* eslint-enable react-hooks/purity */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 flex flex-col fade-in" style={{ height: 'calc(100vh - 128px)', backgroundColor: 'var(--bg-page)' }}>
      {/* Wave background decorative */}
      <div className="wave-container">
        <div className="wave-blue-sm" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue-mid)' }}>
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Companion</h1>
            <p className="text-[9px] font-bold" style={{ color: 'var(--success)' }}>● Companion online</p>
          </div>
        </div>
        <div className="text-[10px] text-right hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
          Redirection companion — here to help you log off.
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs mb-4" style={{ background: 'var(--warning-light)', border: '1px solid #fde68a', color: 'var(--text-primary)' }}>
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
        <span>Reclaim AI provides behaviour-change support and does not replace qualified medical or mental-health care.</span>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} slide-up`}
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 text-xs font-semibold"
              style={{
                background: msg.role === 'user' ? 'var(--accent-blue-light)' : 'var(--bg-subtle)',
                color: msg.role === 'user' ? 'var(--accent-blue-mid)' : 'var(--text-secondary)',
              }}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>

            {/* Bubble container */}
            <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {msg.isHighRisk && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 mb-1">
                  <Phone className="h-3 w-3" /> Urgent escalation pathway
                </div>
              )}

              <div
                className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: msg.role === 'user' ? 'var(--accent-blue-light)' : msg.isHighRisk ? 'var(--error-light)' : '#ffffff',
                  border: '1.5px solid var(--border)',
                  borderColor: msg.role === 'user' ? 'var(--accent-blue-border)' : msg.isHighRisk ? 'var(--error)' : 'var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                }}
              >
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>

              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start slide-up">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      {messages.length <= 1 && (
        <div className="py-3 grid grid-cols-2 gap-2 fade-in">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-left text-xs p-3 rounded-xl border bg-white hover:bg-[var(--bg-subtle)] transition-all cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2.5 items-end">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Send a brief reply to your companion..."
            rows={1}
            className="flex-1 resize-none input-field px-4 py-3 text-sm max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl cursor-pointer disabled:opacity-40"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
        <p className="text-[9px] text-center mt-2.5" style={{ color: 'var(--text-muted)' }}>
          This companion aims to assist you off screen, not keep you typing endlessly.
        </p>
      </div>
    </div>
  );
}
