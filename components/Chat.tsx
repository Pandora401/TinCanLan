import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import ChatInput from './ChatInput';
import Config from './config';

const ENCRYPT_KEY = process.env.NEXT_PUBLIC_ENCRYPT_SECRET_KEY as string;
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
  const [socket, setSocket] = useState<any>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  useEffect(() => {
    const ip = localStorage.getItem('webSocketIp');
    if (ip) {
      const socketConnection = io(ip, { transports: ['websocket'] });
      setSocket(socketConnection);

      socketConnection.on('assignName', (name: string) => {
        setUserName(name);
      });

      socketConnection.on('message', (data: Message) => {
        try {
          const bytes = CryptoJS.AES.decrypt(data.encryptedMessage, ENCRYPT_KEY);
          const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
          setMessages(prev => [...prev, { ...data, decryptedMessage }]);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
        }
      });

      return () => {
        socketConnection.off('assignName');
        socketConnection.off('message');
        socketConnection.disconnect();
      };
    } else {
      setShowConfig(true);
    }
  }, []);

  const handleSaveConfig = (ip: string) => {
    const socketConnection = io(ip, { transports: ['websocket'] });
    setSocket(socketConnection);
    setShowConfig(false);

    socketConnection.on('assignName', (name: string) => {
      setUserName(name);
    });

    socketConnection.on('message', (data: Message) => {
      try {
        const bytes = CryptoJS.AES.decrypt(data.encryptedMessage, ENCRYPT_KEY);
        const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
        setMessages(prev => [...prev, { ...data, decryptedMessage }]);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });
  };

  const handleHostServer = () => {
    alert('Starting server on port 8080...');
    const localIp = 'http://localhost:8080';
    localStorage.setItem('webSocketIp', localIp);
    handleSaveConfig(localIp);
  };

  const handleBack = () => {
    setShowConfig(true);
  };

  const sendMessage = () => {
    if (message.trim() === '') return;

    const encryptedMessage = CryptoJS.AES.encrypt(message, ENCRYPT_KEY).toString();
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

  if (showConfig) {
    return <Config onSave={handleSaveConfig} onHost={handleHostServer} onBack={handleBack} />;
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header Area */}
      <div className="flex-1 overflow-y-auto mb-16">
        <div className="text-white mb-4"><strong>Your Alias:</strong> {userName}</div>
      </div>
      {/* Input Box */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-700">
        <ChatInput
          message={message}
          onChange={e => setMessage(e.target.value)}
          onSend={sendMessage}
        />
      </div>
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto mb-16">
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
                {msg.decryptedMessage}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chat;
