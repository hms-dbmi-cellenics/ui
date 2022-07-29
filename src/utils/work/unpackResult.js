import { decompress } from 'fflate';

// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

const unpackResult = async (storageResp) => {
  console.log('[DEBUG] - BEGUN const arrayBuf = await storageResp.arrayBuffer()');
  const arrayBuf = await storageResp.arrayBuffer();
  console.log('[DEBUG] - FINISHED const arrayBuf = await storageResp.arrayBuffer()');

  const resultPromise = new Promise((resolve, reject) => {
    console.log('[DEBUG] - BEGUN const uint8array = new Uint8Array');
    const uint8array = new Uint8Array(arrayBuf);
    console.log('[DEBUG] - FINISHED const uint8array = new Uint8Array');

    console.log('[DEBUG] - BEGUN decompress');
    decompress(uint8array, (err, decompressed) => {
      console.log('[DEBUG] - FINISHED decompress');
      if (err) {
        reject(err);
      } else {
        console.log('[DEBUG] - BEGUN JSON_parse');
        resolve(JSON_parse(decompressed));
        resolve();
        console.log('[DEBUG] - FINISHED JSON_parse');
      }
    });
  });

  return resultPromise;
};

export default unpackResult;
