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
  'Glucos', 'Septic Tank', ':/', 'Dirt', 'Batman', 'Old Gregg'
];

const assignedNames = new Set();

const getUniqueName = () => {
  let name;
  do {
    name = names[Math.floor(Math.random() * names.length)];
  } while (assignedNames.has(name));
  assignedNames.add(name);
  return name;
};

io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Get IP address
  const ipAddress = socket.request.connection.remoteAddress || 'unknown';
  console.log(`Client IP address: ${ipAddress}`);

  const userName = getUniqueName();
  console.log(`User assigned name: ${userName}`);

  socket.emit('assignName', userName);

  socket.on('message', (encryptedMessage) => {
    io.emit('message', { encryptedMessage, userName });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Remove user name from the set when disconnected
    assignedNames.delete(userName);
  });
});

server.listen(port, () => {
  console.log(`WebSocket server is running on ws://localhost:${port}`);
});
