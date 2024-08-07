// pages/index.tsx
import { NextPage } from 'next';
import Chat from '../components/Chat';

const Home: NextPage = () => {
  return (
    <div className="bg-black text-teal h-screen overflow-hidden">
      <h1 className="text-2xl mb-4 text-white">Encrypted Chat</h1>
      <Chat />
    </div>
  );
};

export default Home;
