import React, { useState } from 'react';

interface ConfigProps {
  onSave: (ip: string) => void;
  onHost: () => void;
  onBack: () => void;
}

const Config: React.FC<ConfigProps> = ({ onSave, onHost, onBack }) => {
  const [ip, setIp] = useState<string>('');
  const [isHosting, setIsHosting] = useState<boolean>(false);

  const handleSave = () => {
    if (ip) {
      localStorage.setItem('webSocketIp', ip);
      onSave(ip);
    }
  };

  const handleHost = () => {
    setIsHosting(true);
    onHost();
  };

  const handleBack = () => {
    setIsHosting(false);
    onBack();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl mb-4">Configure WebSocket</h1>
      <button onClick={handleBack} className="mb-4 px-4 py-2 bg-gray-500 text-white rounded">
        Back
      </button>
      {!isHosting ? (
        <>
          <button onClick={handleHost} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
            Host Your Own Server
          </button>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter WebSocket IP Address"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded"
            />
            <button onClick={handleSave} className="ml-2 px-4 py-2 bg-green-500 text-white rounded">
              Connect
            </button>
          </div>
        </>
      ) : (
        <div className="text-green-500">Hosting your own server...</div>
      )}
    </div>
  );
};

export default Config;
