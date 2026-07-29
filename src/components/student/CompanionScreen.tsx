import { useState } from 'react';
import { ChatInterface, type ChatMessage } from './ChatInterface';
import { callAi } from '@/lib/ai';
import { Brain, Sparkles } from 'lucide-react';

export function CompanionScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const handleSend = async (text: string) => {
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setBusy(true);

    const res = await callAi('companion', text, undefined, 8000);
    if (res.reply) {
      setMessages([...newMessages, { role: 'assistant', content: res.reply }]);
    } else {
      setMessages([...newMessages, {
        role: 'assistant',
        content: "I'm having trouble connecting right now, but I'm still here for you. Here's what I can suggest: take a deep breath, break your task into small steps, and tackle one thing at a time. If you're feeling overwhelmed, reach out to a mentor or campus counselor — they're there to help.",
        fallback: true,
      }]);
    }
    setBusy(false);
  };

  return (
    <div className="max-w-md mx-auto pt-4 animate-fade-in">
      <div className="px-4 mb-2">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-slate-900">AI Companion</h1>
            <p className="text-xs text-slate-400">24/7 support for stress, career, and wellness</p>
          </div>
        </div>
      </div>

      <ChatInterface
        messages={messages}
        onSend={handleSend}
        busy={busy}
        placeholder="Ask me anything..."
        accentColor="brand"
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Hey! I&apos;m your AI Companion.</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
              I can help with exam stress, peer pressure, career guidance, resume tips, and wellness. What&apos;s on your mind?
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["I'm stressed about exams", "Help me with my resume", "I feel peer pressure"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}
