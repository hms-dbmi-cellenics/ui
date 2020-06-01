import socketIOClient from 'socket.io-client';

let io;
const connectionPromise = () => new Promise((resolve) => {
  if (io && io.connected) {
    resolve(io);
  } else {
    io = socketIOClient(process.env.REACT_APP_API_URL);
    io.on('connect', () => {
      resolve(io);
    });
    io.on('error', (error) => {
      console.log(error);
    });
    io.on('connect_error', (error) => {
      console.log(error);
    });
  }
});

export default connectionPromise;
