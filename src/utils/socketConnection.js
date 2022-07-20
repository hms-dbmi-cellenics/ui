import socketIOClient from 'socket.io-client';
import getApiEndpoint from './apiEndpoint';
import { isBrowser } from './deploymentInfo';

const connectionPromise = new Promise((resolve, reject) => {
  /**
 * You likely added a static `import ... from socketConnection.js` to the top of a file.
 * These files are automatically run and evaluted at build-time and during SSR-time.
 * This means the server or your development machine will attempt and fail to connect to the API.
 *
 * To avoid this, imports like these are blocked. You must use `async import()` to dynamically
 * import the promise as necessary during runtime.
 */
  if (!isBrowser) {
    reject(new Error(
      'connectionPromise attempted to run on the server. It must be used through a dynamic import. Search in the code for this error for more details.',
    ));
    return;
  }

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

export default connectionPromise;
