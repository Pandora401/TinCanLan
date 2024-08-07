// ChatInput.tsx
import React from 'react';

interface ChatInputProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  maxLength: number;
}

const ChatInput: React.FC<ChatInputProps> = ({ message, onChange, onSend, maxLength }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center bg-gray-800 border-t border-gray-700 p-2">
      <input
        type="text"
        value={message}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Type your message..."
        maxLength={maxLength}
      />
      <button
        onClick={onSend}
        className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
