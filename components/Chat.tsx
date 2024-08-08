import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import ChatInput from './ChatInput';
import Config from './Config';

const ENCRYPT_KEY = "some_secret";
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
    alert('Starting server...');
    const localIp = 'http://localhost:8080';
    localStorage.setItem('webSocketIp', localIp);
    handleSaveConfig(localIp);
  };

  const handleBack = () => {
    disconnectSocket(); // Disconnect WebSocket
    setShowConfig(true);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
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
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded w-min"
      >
        Back
      </button>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto mb-16">
        <div className="text-white mb-4"><strong>Whoami:</strong> {userName}</div>
        <div>
          {messages.map((msg, index) => (
            <div
              key={index}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              className={`mb-2`}
            >
              <strong className='mr-4'>{msg.userName}</strong>
              <span className={`${hoveredMessageIndex === index ? 'text-white' : 'text-teal-400'}`}>
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
          maxLength={MAX_MESSAGE_LENGTH}
        />
      </div>
    </div>
  );
};

export default Chat;
