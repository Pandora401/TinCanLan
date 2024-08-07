// components/ChatInput.tsx
import React from 'react';

interface ChatInputProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
}


const ChatInput: React.FC<ChatInputProps> = ({ message, onChange, onSend }) => {
  return (
    <div className="flex items-center">
      <input
        type="text"
        value={message}
        onChange={onChange}
        className="flex-1 p-2 mr-2 rounded bg-gray-800 text-white border border-gray-600"
        placeholder="Type your message..."
      />
      <button
        onClick={onSend}
        className="px-4 py-2 rounded bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
