import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import ChatInput from './ChatInput';
import Config from './config';

const ENCRYPT_KEY = "some_secret";
const MAX_MESSAGE_LENGTH = 125;
const DECRYPTION_STEP_DELAY = 25;

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
  const [decryptAll, setDecryptAll] = useState<boolean>(false); // New state

  // Ref to store the interval ID
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

  const startDecryptionAnimation = (index: number) => {
    if (messages[index]) {
      const { encryptedMessage, decryptedMessage } = messages[index];

      // Check if decryptedMessage is defined
      if (decryptedMessage === undefined) {
        console.error('Decrypted message is undefined.');
        return;
      }

      let charIndex = 0;

      // Clear previous interval if it exists
      if (decryptionIntervals.current.has(index)) {
        clearInterval(decryptionIntervals.current.get(index)!);
      }

      const interval = setInterval(() => {
        if (charIndex >= decryptedMessage.length) {
          clearInterval(interval);
          decryptionIntervals.current.delete(index); // Clean up
        } else {
          let newDisplay = '';
          for (let i = 0; i < decryptedMessage.length; i++) {
            newDisplay += i <= charIndex ? decryptedMessage[i] : encryptedMessage[i];
          }
          setMessages(prev =>
            prev.map((msg, i) =>
              i === index ? { ...msg, encryptedMessage: newDisplay } : msg
            )
          );
          charIndex++;
        }
      }, DECRYPTION_STEP_DELAY);

      // Store the interval ID
      decryptionIntervals.current.set(index, interval);
    }
  };

  const resetMessage = () => {
    if (hoveredMessageIndex !== null) {
      // Clear any existing decryption interval
      if (decryptionIntervals.current.has(hoveredMessageIndex)) {
        clearInterval(decryptionIntervals.current.get(hoveredMessageIndex)!);
        decryptionIntervals.current.delete(hoveredMessageIndex);
      }

      // Reset the message to its encrypted state
      setMessages(prev =>
        prev.map((msg, i) =>
          i === hoveredMessageIndex ? { ...msg, encryptedMessage: msg.originalEncryptedMessage! } : msg
        )
      );
    }
  };

  const getMessageDisplay = (msg: string, index: number) => {
    if (alwaysDecrypt || decryptAll) {
      return msg;
    }
    return hoveredMessageIndex === index
      ? `${msg}`
      : `${msg.length > MAX_MESSAGE_LENGTH ? `${msg.slice(0, MAX_MESSAGE_LENGTH)}...` : msg}`;
  };

  const toggleDecryptionMode = () => {
    setAlwaysDecrypt(prev => !prev);
    setDecryptAll(false);
  };

  const toggleDecryptAll = () => {
    setDecryptAll(prev => {
      const newValue = !prev;
      if (newValue) {
        // Decrypt all messages
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            const bytes = CryptoJS.AES.decrypt(msg.encryptedMessage, ENCRYPT_KEY);
            const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
            return { ...msg, decryptedMessage, encryptedMessage: decryptedMessage };
          })
        );
      } else {
        // Encrypt all messages back
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
    return <Config onSave={handleSaveConfig} onHost={handleHostServer}/>;
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 mr-4 px-4 py-2 bg-red-500 text-white rounded w-min"
        >
          Back
        </button>

        {/* Toggle Decryption Mode Button */}
        <button
          onClick={toggleDecryptionMode}
          className="mb-4 mr-4 px-4 py-2 bg-teal-500 text-white rounded w-min"
        >
          {alwaysDecrypt ? 'Locked' : 'Unlocked'}
        </button>

        {/* Decrypt All Button */}
        <button
          onClick={toggleDecryptAll}
          className="mb-4 px-4 py-2 bg-yellow-500 text-white rounded w-min"
        >
          {decryptAll ? 'Encrypted' : 'Decrypted'}
        </button>
      </div>
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto mb-16">
        <div className="text-white mb-4"><strong>Whoami:</strong> {userName}</div>
        <div>
          {messages.map((msg, index) => (
            <div
              key={index}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              className="mb-2"
            >
              <strong className='mr-4 text-white'>{msg.userName}</strong>
              <span className={`${hoveredMessageIndex === index ? 'text-white' : 'text-teal-400'}`}>
                {getMessageDisplay(msg.encryptedMessage, index)}
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
