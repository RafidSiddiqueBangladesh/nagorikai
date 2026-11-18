import { Download, MessageSquare, Play, Search, Trash2, Volume2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SignSequenceStep, TranscriptMessage } from '../types/signtalk';

interface TranscriptSidebarProps {
  messages: TranscriptMessage[];
  activePlaybackMessageId: string | null;
  onReplaySequence: (messageId: string, steps: SignSequenceStep[], startIndex?: number) => void;
  onSpeakBangla: (text: string) => void;
  onClearMessages: () => void;
}

export function TranscriptSidebar({
  messages,
  activePlaybackMessageId,
  onReplaySequence,
  onSpeakBangla,
  onClearMessages,
}: TranscriptSidebarProps) {
  const [filter, setFilter] = useState<'all' | 'speaker' | 'signer'>('all');
  const [query, setQuery] = useState('');

  const filteredMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((msg) => {
      if (filter !== 'all' && msg.role !== filter) return false;
      if (!q) return true;
      return (
        msg.banglaText.toLowerCase().includes(q) ||
        msg.englishText.toLowerCase().includes(q) ||
        msg.originalText.toLowerCase().includes(q)
      );
    });
  }, [messages, filter, query]);

  const handleExport = () => {
    if (messages.length === 0) return;
    const lines = messages.map((m) => {
      const who = m.role === 'speaker' ? 'Speaker (Spoken -> Sign)' : 'Signer (Sign -> Bangla)';
      const signs = m.signSteps.map((s) => s.sign.bangla).join(' -> ');
      return `[${m.timestamp}] ${who}\nBangla: ${m.banglaText}\nEnglish: ${m.englishText}\nBdSL Steps: ${signs}\n`;
    });
    const blob = new Blob([lines.join('\n---\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signtalk-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-900/90 border-l border-slate-200 dark:border-white/10">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-700 dark:text-sky-400 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Conversation Transcript
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {messages.length} {messages.length === 1 ? 'entry' : 'entries'} · All spoken &amp; signed text
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            disabled={messages.length === 0}
            title="Export transcript"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md disabled:opacity-35 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClearMessages}
            disabled={messages.length === 0}
            title="Clear transcript"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md disabled:opacity-35 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Dialogue
          </button>
          <button
            type="button"
            onClick={() => setFilter('speaker')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'speaker'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Spoken → Sign
          </button>
          <button
            type="button"
            onClick={() => setFilter('signer')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'signer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign → Bangla
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bangla or English text..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-md text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Scrollable Transcript Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No dialogue yet</p>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Speak or type in Bangla/English to see slow 3D sign language explanations, or sign in front of MediaPipe camera to convert signs into Bangla.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isActive = activePlaybackMessageId === msg.id;
            const isSpeaker = msg.role === 'speaker';

            return (
              <div
                key={msg.id}
                className={`p-4 transition-colors ${
                  isActive ? 'bg-blue-50/70 dark:bg-sky-950/35' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Clean Unboxed Metadata Header */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      className={`font-semibold ${
                        isSpeaker ? 'text-blue-700 dark:text-sky-400' : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {msg.callerLabel || (isSpeaker ? 'Speaking Person' : 'Sign Language User')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bengali">
                      {isSpeaker ? 'কথোপকথন' : 'ইশারা ভাষা'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{msg.source}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Primary Bangla & English Copy */}
                <div className="mt-2 space-y-1">
                  <p className="text-[15px] font-bengali font-semibold text-slate-900 dark:text-white leading-snug">
                    {msg.banglaText}
                  </p>
                  {msg.englishText && msg.englishText !== msg.banglaText && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {msg.englishText}
                    </p>
                  )}
                </div>

                {/* Interactive BdSL Sign Steps */}
                {msg.signSteps.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {msg.signSteps.map((step, idx) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => onReplaySequence(msg.id, msg.signSteps, idx)}
                        title={`Explain "${step.sign.bangla}" on 3D model`}
                        className="px-2 py-1 text-xs font-bengali font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-sky-900/60 hover:text-blue-800 dark:hover:text-sky-300 text-slate-700 dark:text-slate-200 rounded transition-colors"
                      >
                        {step.sign.bangla}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Row */}
                <div className="mt-3 flex items-center gap-3 text-xs">
                  {msg.signSteps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onReplaySequence(msg.id, msg.signSteps, 0)}
                      className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isActive ? 'Playing on 3D Model' : 'Explain Slowly in 3D'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSpeakBangla(msg.banglaText)}
                    className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Speak Bangla
                  </button>

                  {msg.confidence !== undefined && (
                    <span className="ml-auto text-[11px] font-mono text-slate-400 tabular-nums">
                      {Math.round(msg.confidence * 100)}% match
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
