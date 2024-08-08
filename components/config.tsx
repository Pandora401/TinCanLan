import React, { useState } from 'react';

interface ConfigProps {
  onSave: (ip: string) => void;
  onHost: () => void;
  onBack: () => void;
}

const Config: React.FC<ConfigProps> = ({ onSave, onHost }) => {
  const [ip, setIp] = useState<string>('');
  const [isHosting, setIsHosting] = useState<boolean>(false);

  const handleSave = () => {
    if (ip) {
      const ipAddress = ip.split(':')[0];
      const fullIp = `${ipAddress}:8080`;
      localStorage.setItem('webSocketIp', fullIp);
      onSave(fullIp);
    }
  };

  const handleHost = () => {
    setIsHosting(true);
    onHost();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {!isHosting ? (
        <>
          <button onClick={handleHost} className="px-4 py-2 bg-blue-400 text-white rounded">
            Host
          </button>
          <h1 className="text-2xl mb-4 mt-4">OR</h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Connect to IP address"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded"
            />
            <button onClick={handleSave} className="ml-2 px-4 py-2 bg-teal-500 text-white rounded">
              Join
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
