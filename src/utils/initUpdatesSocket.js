import socketIOClient from 'socket.io-client';
import getApiEndpoint from './apiEndpoint';

const initUpdatesSocket = async (experimentId, cb) => {
  const io = socketIOClient(getApiEndpoint());
  io.on(`ExperimentUpdates-${experimentId}`, cb);
  return io;
};

export default initUpdatesSocket;
