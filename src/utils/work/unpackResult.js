import { decompress } from 'fflate';
import { isZstdCompressed } from './fzstdDecompress';


const unpackResult = async (storageResp, taskName = null) => {
  if (taskName === 'DownloadAnnotSeuratObject' || taskName === 'GetNormalizedExpression') {
    const blob = await storageResp.blob();
    return (blob);
  }

  const arrayBuf = await storageResp.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuf);
  const decompressed = await decompressUint8Array(uint8);
  return decompressed;
};


const decompressUint8Array = async (array) => {
  if (isZstdCompressed(array)) {
    return array; // Pass raw to zstd parser downstream
  }
  return new Promise((resolve, reject) => {
    decompress(array, (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        resolve(decompressed);
      }
    });
  });
};

export { decompressUint8Array };
export default unpackResult;
