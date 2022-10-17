import { decompress } from 'fflate';

const unpackResult = async (storageResp) => {
  const arrayBuf = await storageResp.arrayBuffer();

  const resultPromise = new Promise((resolve, reject) => {
    const uint8array = new Uint8Array(arrayBuf);

    decompress(uint8array, (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        resolve(decompressed);
      }
    });
  });

  return resultPromise;
};

export default unpackResult;
