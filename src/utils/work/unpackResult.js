import { decompress } from 'fflate';

const unpackResult = async (storageResp, taskName = null) => {
  // SeuratObject can fail to download when loaded into memory
  if (taskName === 'DownloadAnnotSeuratObject' || taskName === 'GetNormalizedExpression') {
    const blob = await storageResp.blob();
    return (blob);
  }

  const arrayBuf = await storageResp.arrayBuffer();

  return decompressUint8Array(new Uint8Array(arrayBuf));
};

const decompressUint8Array = async (array) => (
  new Promise((resolve, reject) => {
    decompress(array, (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        resolve(decompressed);
      }
    });
  })
);

export { decompressUint8Array };
export default unpackResult;
