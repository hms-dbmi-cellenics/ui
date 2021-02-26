import socketIOClient from 'socket.io-client';
import getApiEndpoint from './apiEndpoint';

const initUpdateSocket = async (experimentId, cb) => {
  const io = socketIOClient(getApiEndpoint());
  io.on(`ExperimentUpdates-${experimentId}`, cb);
  return io;
};

export default initUpdateSocket;
