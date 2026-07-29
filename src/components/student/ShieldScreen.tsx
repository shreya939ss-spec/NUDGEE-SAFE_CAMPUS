import { useState } from 'react';
import { ChatInterface, type ChatMessage } from './ChatInterface';
import { callAi, SHIELD_FALLBACK } from '@/lib/ai';
import { Shield, AlertTriangle, Phone } from 'lucide-react';

export function ShieldScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  const handleSend = async (text: string) => {
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setBusy(true);

    const res = await callAi('shield', text, undefined, 4000);

    if (res.reply && !res.error) {
      setMessages([...newMessages, { role: 'assistant', content: res.reply }]);
    } else {
      // Hardcoded fallback — never let this feature depend on a live call
      setMessages([...newMessages, { role: 'assistant', content: SHIELD_FALLBACK, fallback: true }]);
    }
    setBusy(false);
  };

  return (
    <div className="max-w-md mx-auto pt-4 animate-fade-in">
      <div className="px-4 mb-2">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-error-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold text-slate-900">Pressure Shield</h1>
            <p className="text-xs text-slate-400">Get an escape line for any pressure situation</p>
          </div>
          <button
            onClick={() => setSosOpen(true)}
            className="flex items-center gap-1.5 bg-error-500 hover:bg-error-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors animate-pulse"
          >
            <Phone className="w-3.5 h-3.5" /> SOS
          </button>
        </div>
      </div>

      <ChatInterface
        messages={messages}
        onSend={handleSend}
        busy={busy}
        placeholder="Describe the pressure you're facing..."
        accentColor="error"
        showWarning
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-error-50 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-error-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Pressure Shield is ready.</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
              Tell me what's happening — being pushed to drink, smoke, or anything else. I'll give you an escape line you can use right now.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['Friends are pushing me to drink', 'Someone offered me a cigarette', 'Pressure to try drugs at a party'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-500 hover:border-error-300 hover:text-error-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* SOS Modal */}
      {sosOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSosOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-error-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-error-500" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">You're not alone.</h3>
              <p className="text-sm text-slate-500 mt-1.5">If you're in immediate danger or need urgent help, reach out now:</p>
              <div className="w-full space-y-2 mt-4">
                <a href="tel:112" className="flex items-center justify-center gap-2 w-full bg-error-500 hover:bg-error-600 text-white font-semibold py-3 rounded-xl transition-colors">
                  <Phone className="w-4 h-4" /> Call Emergency (112)
                </a>
                <a href="tel:100" className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
                  <Phone className="w-4 h-4" /> Campus Security (100)
                </a>
                <p className="text-xs text-slate-400 mt-3">You can also reach out to your assigned mentor through the app.</p>
              </div>
              <button onClick={() => setSosOpen(false)} className="mt-4 text-sm text-slate-400 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
