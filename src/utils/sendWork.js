import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import connectionPromise from './socketConnection';


const sendWork = async (experimentId, timeout, body) => {
  const requestUuid = uuidv4();
  const timeoutDate = moment().add(timeout, 's').toISOString();

  const io = await connectionPromise();

  const request = {
    uuid: requestUuid,
    socketId: io.id,
    experimentId,
    timeout: timeoutDate,
    body,
  };

  io.emit('WorkRequest', request);

  const responsePromise = new Promise((resolve) => {
    io.on(`WorkResponse-${requestUuid}`, (res) => resolve(res));
  });

  const timeoutPromise = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timeout of ${timeout} seconds has expired.`));
    }, timeout * 1000);
  });

  return Promise.race([responsePromise, timeoutPromise]);
};


export default sendWork;
