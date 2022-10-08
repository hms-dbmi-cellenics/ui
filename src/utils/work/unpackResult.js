import { decompress } from 'fflate';

// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

const unpackResult = async (storageResp) => {
  const arrayBuf = await storageResp.arrayBuffer();

  const resultPromise = new Promise((resolve, reject) => {
    const uint8array = new Uint8Array(arrayBuf);

    decompress(uint8array, (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON_parse(decompressed));
        resolve();
      }
    });
  });

  return resultPromise;
};

export default unpackResult;
