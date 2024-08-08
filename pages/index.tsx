import { NextPage } from 'next';
import Chat from '../components/Chat';

const Home: NextPage = () => {
  return (
    <div className="bg-black text-teal h-screen overflow-hidden flex flex-col">
      <h1 className="text-4xl font-bold text-white mb-6 mt-8 mx-auto px-4 py-2 border-b-4 border-teal-500 shadow-lg rounded-lg bg-gray-900">
        Tin Can Lan
      </h1>
      <Chat />
    </div>
  );
};

export default Home;
