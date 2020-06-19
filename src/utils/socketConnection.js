import socketIOClient from 'socket.io-client';
import getApiEndpoint from './apiEndpoint';

let io;
const connectionPromise = () => new Promise((resolve) => {
  if (io && io.connected) {
    resolve(io);
  } else {
    io = socketIOClient(getApiEndpoint());
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
