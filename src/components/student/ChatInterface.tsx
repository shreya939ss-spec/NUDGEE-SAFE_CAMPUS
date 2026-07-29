import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  fallback?: boolean;
};

export function ChatInterface({
  messages,
  onSend,
  busy,
  placeholder,
  accentColor,
  emptyState,
  showWarning,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  busy: boolean;
  placeholder: string;
  accentColor: 'brand' | 'error';
  emptyState: ReactNode;
  showWarning?: boolean;
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    onSend(input.trim());
    setInput('');
  };

  const accentBg = accentColor === 'error' ? 'bg-error-500 hover:bg-error-600' : 'bg-brand-500 hover:bg-brand-600';
  const accentText = accentColor === 'error' ? 'text-error-600' : 'text-brand-600';
  const accentBubble = accentColor === 'error' ? 'bg-error-50 text-error-900' : 'bg-brand-50 text-brand-900';
  const accentIcon = accentColor === 'error' ? 'bg-error-100' : 'bg-brand-100';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 140px)' }}>
      {showWarning && (
        <div className={`mx-4 mb-2 px-3.5 py-2.5 rounded-xl text-xs ${accentBubble} flex items-start gap-2`}>
          <span className="font-semibold">If you're in immediate danger, contact emergency services or campus security right away.</span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-3 pb-2">
        {messages.length === 0 && emptyState}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className={`w-7 h-7 rounded-lg ${accentIcon} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-xs font-bold">N</span>
                </div>
              )}
              <div
                className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-2xl rounded-tr-md'
                    : `${accentBubble} rounded-2xl rounded-tl-md`
                }`}
              >
                {msg.content}
                {msg.fallback && (
                  <div className="mt-2 pt-2 border-t border-current/10 text-xs opacity-70">
                    Offline fallback response — AI may be unavailable.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start animate-slide-up">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg ${accentIcon} flex items-center justify-center`}>
                <span className="text-xs font-bold">N</span>
              </div>
              <div className={`px-4 py-3 rounded-2xl rounded-tl-md ${accentBubble}`}>
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl pl-4 pr-1.5 py-1.5 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className={`w-9 h-9 rounded-xl ${accentBg} text-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
