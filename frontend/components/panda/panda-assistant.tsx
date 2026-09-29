'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MessageSquare, X, Send, Sparkles, Shield, Minimize2, Maximize2, Bot, User as UserIcon } from 'lucide-react';
import { chatApi, ChatReply } from '../../services/chatApi';
import { useAuth } from '../../lib/auth-context';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'panda';
  text: string;
  timestamp: string;
  groundingContext?: Record<string, unknown>;
}

export function PandaAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'panda',
      text: "Hello! I am HealthFlow Panda, your healthcare resource intelligence assistant. I monitor stock levels, demand trends, and transfer logistics across our network. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getSuggestedQuestions = () => {
    if (user?.role === 'HOSPITAL_MANAGER') {
      return [
        'Which resources in my facility may run out soon?',
        'What is our current daily burn rate?',
        'Show active incoming transfers for my facility.',
        'Why is our stock level flagged at risk?',
      ];
    }
    if (user?.role === 'SUPPLY_MANAGER') {
      return [
        'Where is available surplus inventory located?',
        'Show pending transfer requests requiring approval.',
        'Which facilities have the largest supply deficits?',
        'Show in-transit resource shipments.',
      ];
    }
    return [
      'Which facility is at highest risk?',
      'Which resources may run out soon?',
      'Where is surplus inventory located?',
      'Why is PHC Bakshi Ka Talab at critical risk?',
      'Show active transfers across the network.',
    ];
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      // Build history for backend
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response: ChatReply = await chatApi.sendMessage(textToSend, history);

      const pandaMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'panda',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingContext: response.groundingContext,
      };

      setMessages((prev) => [...prev, pandaMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'panda',
        text: 'I apologize, but I could not reach the clinical intelligence backend at this moment. Please ensure the backend gateway is active.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-teal-800 text-white px-4 py-3 shadow-elevated hover:bg-teal-900 transition-all hover:scale-105 group border border-teal-600"
          aria-label="Open HealthFlow Panda AI Assistant"
        >
          <div className="relative">
            <span className="text-xl">🐼</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-none tracking-tight">Ask Panda AI</p>
            <p className="text-[10px] text-teal-200 leading-none mt-1">Resource Intelligence</p>
          </div>
        </button>
      )}

      {/* Slide-out / Floating Chat Window */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xl border border-white/20">
                  🐼
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white p-0.5 shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center">
                  <Image src="/icon-transparent.png" alt="HealthFlow AI" width={16} height={16} className="h-full w-full object-contain" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">HealthFlow Panda</h3>
                  <Badge variant="healthy" className="text-[10px] py-0 px-1.5">
                    Grounded AI
                  </Badge>
                </div>
                <p className="text-[11px] text-teal-200">Predict. Prevent. Protect.</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Grounding Status Bar */}
          <div className="bg-teal-50/80 px-3.5 py-1.5 border-b border-teal-100/60 flex items-center justify-between text-[11px] text-teal-900">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-teal-700" />
              <span>Grounded in PostgreSQL & ML Engine</span>
            </div>
            <span className="font-medium text-[10px] text-teal-700">Role: {user?.role || 'Guest'}</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isPanda = m.sender === 'panda';
              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex gap-2.5 max-w-[90%]',
                    isPanda ? 'mr-auto' : 'ml-auto flex-row-reverse'
                  )}
                >
                  <div
                    className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5',
                      isPanda ? 'bg-teal-100 text-teal-800' : 'bg-slate-800 text-white'
                    )}
                  >
                    {isPanda ? '🐼' : <UserIcon className="h-3.5 w-3.5" />}
                  </div>

                  <div>
                    <div
                      className={cn(
                        'p-3 rounded-2xl text-xs leading-relaxed',
                        isPanda
                          ? 'bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-tl-none'
                          : 'bg-teal-700 text-white rounded-tr-none'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Display Grounding metrics badge if available */}
                      {isPanda && m.groundingContext && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {Boolean(m.groundingContext.highRiskCount) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              ● {String(m.groundingContext.highRiskCount)} At-Risk Resources
                            </span>
                          )}
                          {Boolean(m.groundingContext.activeAlertCount) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              ▲ {String(m.groundingContext.activeAlertCount)} Active Alerts
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 px-1 mt-0.5 block">{m.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 max-w-[80%] mr-auto">
                <div className="h-7 w-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs shrink-0">
                  🐼
                </div>
                <div className="p-3 bg-white text-slate-500 rounded-2xl rounded-tl-none border border-slate-200 text-xs flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-teal-600 animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="h-2 w-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px]">Consulting real-time database...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Suggested Questions Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Suggested Questions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {getSuggestedQuestions().slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors text-left truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Panda about facilities, risk, surplus..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-3 h-8"
              aria-label="Send query"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
