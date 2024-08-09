import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import ChatInput from './ChatInput';
import Config from './Config';

const ENCRYPT_KEY = "some_secret";
const MAX_MESSAGE_LENGTH = 125;

interface Message {
  encryptedMessage: string;
  userName: string;
  decryptedMessage?: string;
  originalEncryptedMessage?: string;
}

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [alwaysDecrypt, setAlwaysDecrypt] = useState<boolean>(false);
  const [decryptAll, setDecryptAll] = useState<boolean>(false);

  const decryptionIntervals = useRef<Map<number, NodeJS.Timeout>>(new Map());

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
          setMessages(prev => [...prev, { ...data, decryptedMessage, originalEncryptedMessage: data.encryptedMessage }]);
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
        setMessages(prev => [...prev, { ...data, decryptedMessage, originalEncryptedMessage: data.encryptedMessage }]);
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
    disconnectSocket();
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
    if (!alwaysDecrypt && !decryptAll) {
      setHoveredMessageIndex(index);
      startDecryptionAnimation(index);
    }
  };

  const handleMouseLeave = () => {
    if (!alwaysDecrypt && !decryptAll) {
      setHoveredMessageIndex(null);
      resetMessage();
    }
  };

  // Inspired by the following project:
  // https://codepen.io/Hyperplexed/pen/rNrJgrd
  const startDecryptionAnimation = (index: number) => {
    if (messages[index]) {
      const { encryptedMessage, decryptedMessage } = messages[index];
  
      if (decryptedMessage === undefined) {
        console.error('Decrypted message is undefined.');
        return;
      }
  
      let charIndex = 0;
      let iteration = 0;
      const letters = "abcdefghijklmnopqrstuvwxyz1234567890";
      
      // interval duration
      const INTERVAL_DURATION = 30;
      // increment rate
      const INCREMENT_RATE = 1;
  
      if (decryptionIntervals.current.has(index)) {
        clearInterval(decryptionIntervals.current.get(index)!);
      }
  
      const interval = setInterval(() => {
        setMessages(prev =>
          prev.map((msg, i) =>
            i === index
              ? {
                  ...msg,
                  encryptedMessage: msg.encryptedMessage
                    .split("")
                    .map((letter, idx) => {
                      if (idx < charIndex) {
                        return decryptedMessage[idx];
                      }
  
                      return letters[Math.floor(Math.random() * 26)];
                    })
                    .join("")
                }
              : msg
          )
        );
  
        iteration += INCREMENT_RATE;
        if (iteration >= decryptedMessage.length) {
          clearInterval(interval);
          decryptionIntervals.current.delete(index);
          setMessages(prev =>
            prev.map((msg, i) =>
              i === index ? { ...msg, encryptedMessage: decryptedMessage } : msg
            )
          );
        } else {
          charIndex = Math.floor(iteration);
        }
      }, INTERVAL_DURATION);
  
      decryptionIntervals.current.set(index, interval);
    }
  };
  
  

  const resetMessage = () => {
    if (hoveredMessageIndex !== null) {
      if (decryptionIntervals.current.has(hoveredMessageIndex)) {
        clearInterval(decryptionIntervals.current.get(hoveredMessageIndex)!);
        decryptionIntervals.current.delete(hoveredMessageIndex);
      }

      setMessages(prev =>
        prev.map((msg, i) =>
          i === hoveredMessageIndex ? { ...msg, encryptedMessage: msg.originalEncryptedMessage! } : msg
        )
      );
    }
  };

  const toggleDecryptionMode = () => {
    setAlwaysDecrypt(prev => !prev);
    setDecryptAll(false);
  };

  const toggleDecryptAll = () => {
    setDecryptAll(prev => {
      const newValue = !prev;
      if (newValue) {
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            const bytes = CryptoJS.AES.decrypt(msg.encryptedMessage, ENCRYPT_KEY);
            const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
            return { ...msg, decryptedMessage, encryptedMessage: decryptedMessage };
          })
        );
      } else {
        setMessages(prevMessages =>
          prevMessages.map(msg => ({
            ...msg,
            encryptedMessage: msg.originalEncryptedMessage!
          }))
        );
      }
      return newValue;
    });
    setAlwaysDecrypt(false);
  };

  if (showConfig) {
    return <Config onSave={handleSaveConfig} onHost={handleHostServer} />;
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className='flex'>
        <button
          onClick={handleBack}
          className="mb-4 mr-4 px-4 py-2 bg-red-500 text-white rounded w-min border-2 border-red-500 bg-opacity-15 hover:bg-opacity-30"
        >
          Back
        </button>
        <button
          onClick={toggleDecryptAll}
          className="mb-4 mr-4 px-4 py-2 bg-yellow-500 text-white rounded w-min border-2 border-yellow-500 bg-opacity-15 hover:bg-opacity-30"
        >
          {decryptAll ? 'Decrypted' : 'Encrypted'}
        </button>
        <button
          onClick={toggleDecryptionMode}
          className={
            !decryptAll 
            ? `mb-4 mr-4 px-4 py-2 bg-teal-500 text-white rounded w-min border-2 border-teal-500 bg-opacity-15 hover:bg-opacity-30` 
            : `mb-4 mr-4 px-4 py-2 bg-gray-500 text-white rounded w-min border-2 border-gray-700 bg-opacity-15`
          }
          disabled={decryptAll}
        >
          {alwaysDecrypt ? 'Locked' : 'Unlocked'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto mb-16">
        <div className="text-white mb-4"><strong>Whoami:</strong> {userName}</div>
        <div>
          {messages.map((msg, index) => (
            <div
              key={index}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              className="mb-4 mr-4 px-4 py-2 bg-gray-800 rounded border-2 border-gray-800 bg-opacity-20 hover:bg-opacity-25"
              style={{ maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-wrap' }}
            >
              <div className="text-white font-bold mb-1">{msg.userName}</div>
              <div className={`${hoveredMessageIndex === index ? 'text-white' : 'text-teal-400'}`}>
                {msg.encryptedMessage}
              </div>
            </div>
          ))}
        </div>
      </div>
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
