import socketIOClient from 'socket.io-client';
import getApiEndpoint from './apiEndpoint';

const initUpdateSocket = async (experimentId, cb) => {
  const io = socketIOClient(getApiEndpoint());
  io.on(`ExperimentUpdates-${experimentId}`, (update) => cb(experimentId, update));
  return io;
};

export default initUpdateSocket;
