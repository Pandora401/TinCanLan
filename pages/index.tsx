import { NextPage } from 'next';
import Chat from '../components/Chat';

const Home: NextPage = () => {
  return (
    <div className="bg-black text-teal h-screen overflow-hidden flex flex-col">
      <div className="mb-6 mt-8 mx-auto px-4 py-2 border-b-4 border-teal-500 shadow-lg rounded-lg bg-gray-900">
      <h1 className="text-4xl font-bold text-white">
        Tin Can Lan
      </h1>
      </div>
      <Chat />
    </div>
  );
};

export default Home;
