// components/Chat.tsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import ChatInput from './ChatInput';

const socket = io('http://localhost:8080', {
  transports: ['websocket'],
});

const SECRET_KEY = 'your-secret-key';
const MAX_MESSAGE_LENGTH = 100;

interface Message {
  encryptedMessage: string;
  userName: string;
  decryptedMessage?: string;
}

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    socket.on('assignName', (name: string) => {
      setUserName(name);
    });

    socket.on('message', (data: Message) => {
      try {
        const bytes = CryptoJS.AES.decrypt(data.encryptedMessage, SECRET_KEY);
        const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
        setMessages(prev => [...prev, { ...data, decryptedMessage }]);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    return () => {
      socket.off('assignName');
      socket.off('message');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === '') return;

    const encryptedMessage = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
    socket.emit('message', encryptedMessage);
    setMessage('');
  };

  const handleMouseEnter = (index: number) => {
    setHoveredMessageIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredMessageIndex(null);
  };

  const getMessageDisplay = (msg: string) => {
    if (msg.length > MAX_MESSAGE_LENGTH) {
      return `${msg.slice(0, MAX_MESSAGE_LENGTH)}...`;
    }
    return msg;
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto mb-16">
        <div className="text-white mb-4"><strong>Your Alias:</strong> {userName}</div>
        <div>
          {messages.map((msg, index) => (
            <div
              key={index}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              className="mb-2 text-white"
            >
              <strong>{msg.userName}:</strong> 
              <span>
                {hoveredMessageIndex === index ? msg.decryptedMessage : getMessageDisplay(msg.encryptedMessage)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-700">
        <ChatInput
          message={message}
          onChange={e => setMessage(e.target.value)}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
};

export default Chat;
