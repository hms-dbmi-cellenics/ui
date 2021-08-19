import socketIOClient from 'socket.io-client';
import getApiEndpoint from './apiEndpoint';

const connectionPromise = new Promise((resolve, reject) => {
  const io = socketIOClient(
    getApiEndpoint(),
    {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 500,
    },
  );

  io.on('connect', () => {
    // There is a bug where `io.id` is simply not getting assigned straight away
    // even though it should be. We don't know what causes this, so we are just waiting
    // in the callback until an `id` property is found in the object.
    const interval = setInterval(() => {
      if (!io.id) {
        return;
      }

      clearInterval(interval);
      resolve(io);
    }, 10);
  });
  io.on('error', (error) => {
    io.close();
    reject(error);
  });
  io.on('connect_error', (error) => {
    io.close();
    reject(error);
  });
});

export default () => connectionPromise;
