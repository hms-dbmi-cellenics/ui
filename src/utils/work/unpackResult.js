import { decompress } from 'fflate';

// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

const unpackResult = async (storageResp, isJson) => {
  const arrayBuf = await storageResp.arrayBuffer();

  const resultPromise = new Promise((resolve, reject) => {
    const uint8array = new Uint8Array(arrayBuf);

    decompress(uint8array, (err, decompressed) => {
      if (err) {
        reject(err);
      } else if (isJson) {
        resolve(JSON_parse(decompressed));
      } else {
        resolve(decompressed);
      }
    });
  });

  return resultPromise;
};

export default unpackResult;
