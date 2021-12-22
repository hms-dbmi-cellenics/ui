import { decompress, strFromU8 } from 'fflate';

import { parseAsync } from 'js-coroutines';

// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

const unpackResult = async (storageResp) => {
  const arrayBuf = await storageResp.arrayBuffer();

  const resultPromise = new Promise((resolve, reject) => {
    decompress(new Uint8Array(arrayBuf), (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        console.log('decompressedDebug');
        console.log(decompressed);

        const decoeded = strFromU8(decompressed);

        console.log('decoededDebug');
        console.log(decoeded);

        parseAsync(decoeded).then((result) => {
          console.log('resultDebug');
          console.log(result);
        });

        resolve(JSON_parse(decompressed));
      }
    });
  });

  return resultPromise;
};

export default unpackResult;
