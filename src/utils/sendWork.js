import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import connectionPromise from './socketConnection';


const sendWork = (experimentId, timeout, body) => new Promise((resolve, reject) => {
  const requestUuid = uuidv4();

  const timeoutDate = moment().add(timeout, 's').toISOString();

  connectionPromise().then((io) => {
    const request = {
      uuid: requestUuid,
      socketId: io.id,
      experimentId,
      timeout: timeoutDate,
      body,
    };

    io.emit('WorkRequest', request);

    io.on(`WorkResponse-${requestUuid}`, (res) => {
      resolve(res);
    });

    setTimeout(() => reject(new Error(`Timeout of ${timeout} seconds has expired.`)), timeout * 1000);
  });
});

export default sendWork;
