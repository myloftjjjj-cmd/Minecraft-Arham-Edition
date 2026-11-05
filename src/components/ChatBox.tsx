/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { modLoader, CommandContext } from '../engine/mods';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color?: string;
  time: string;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  cmdContext: CommandContext;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ isOpen, onClose, cmdContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Server', text: 'Welcome to ARHAM-MC! Press T or / to chat. Type /help for commands.', color: '#38bdf8', time: '12:00' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (sender: string, text: string, color?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Math.random().toString(), sender, text, color, time }]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) {
      onClose();
      return;
    }

    if (text.startsWith('/')) {
      // Execute slash command
      const enrichedContext: CommandContext = {
        ...cmdContext,
        addChatMessage: ({ sender, text, color }) => addMsg(sender, text, color),
      };
      modLoader.executeCommand(text, enrichedContext);
    } else {
      // Regular chat message
      addMsg('Player', text, '#ffffff');
    }

    setInput('');
    onClose();
  };

  return (
    <div className={`fixed left-4 bottom-24 z-50 w-full max-w-md pointer-events-auto select-none ${isOpen ? 'block' : 'opacity-85'}`}>
      {/* Message Log */}
      <div className="bg-black/60 border border-stone-800 p-2 max-h-48 overflow-y-auto space-y-1 font-mono text-xs text-white">
        {messages.map(m => (
          <div key={m.id} className="leading-snug">
            <span className="text-stone-400 text-[10px] mr-1.5">[{m.time}]</span>
            <span style={{ color: m.color || '#94a3b8' }} className="font-bold mr-1.5">
              &lt;{m.sender}&gt;
            </span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box (only interactive when chat opened) */}
      {isOpen && (
        <form onSubmit={handleSend} className="mt-1 flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message or /help..."
            className="flex-1 px-3 py-1.5 bg-black/85 border border-cyan-400 text-white font-mono text-xs outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-mono font-bold cursor-pointer"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};
