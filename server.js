const http = require('http');
const socketIo = require('socket.io');
const port = 8080;

const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const names = [
  'Jian Yang', 'Phat Phuk', 'Dr. Loving', 'Filthy Frank',
  'Glucos', 'Septic Tank', ':/', 'Dirt'
];

const getRandomName = () => {
  const randomIndex = Math.floor(Math.random() * names.length);
  return names[randomIndex];
};

io.on('connection', (socket) => {
  console.log('Client connected');

  const userName = getRandomName();
  console.log(`User assigned name: ${userName}`);

  socket.emit('assignName', userName);

  socket.on('message', (encryptedMessage) => {
    io.emit('message', { encryptedMessage, userName });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`WebSocket server is running on ws://localhost:${port}`);
});
