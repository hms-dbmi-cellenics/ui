import { decompress } from 'fflate';

// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

const unpackResult = async (storageResp) => {
  const arrayBuf = await storageResp.arrayBuffer();

  const resultPromise = new Promise((resolve, reject) => {
    decompress(new Uint8Array(arrayBuf), (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON_parse(decompressed));
      }
    });
  });

  return resultPromise;
};

export default unpackResult;
