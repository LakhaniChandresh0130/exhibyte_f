let dotenvLoaded = false;
try {
  require('dotenv').config();
  dotenvLoaded = true;
} catch (e) {
}

const http = require('http');
const net = require('net');
const app = require('./app');

const getAvailablePort = (preferredPort) => new Promise((resolve, reject) => {
  const tester = net.createServer();

  tester.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      resolve(getAvailablePort(preferredPort + 1));
      return;
    }

    reject(err);
  });

  tester.once('listening', () => {
    tester.close(() => resolve(preferredPort));
  });

  tester.listen(preferredPort);
});

const startServer = async () => {
  const preferredPort = Number(process.env.PORT || 5000);

  try {
    const port = await getAvailablePort(preferredPort);
    const server = http.createServer(app);

    server.on('error', (err) => {
      console.error('Server failed to start:', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is still unavailable. Stop the running instance or set PORT to a free port.`);
      }
    });

    server.listen(port, () => {
      console.log(`Server listening on port ${port}${dotenvLoaded ? '' : ' (dotenv not installed)'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();


