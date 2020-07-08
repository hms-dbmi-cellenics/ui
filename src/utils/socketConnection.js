import socketIOClient from 'socket.io-client';
import getApiEndpoint from './apiEndpoint';

let io;

const connectionPromise = () => new Promise((resolve, reject) => {
  if (io && io.connected) {
    resolve(io);
  } else {
    io = socketIOClient(getApiEndpoint());
    io.on('connect', () => {
      resolve(io);
    });
    io.on('error', (error) => {
      io.close();
      reject(error);
    });
    io.on('connect_error', (error) => {
      io.close();
      reject(error);
    });
  }
});

export default connectionPromise;
