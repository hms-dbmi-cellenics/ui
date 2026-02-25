// eslint-disable-next-line camelcase

import { JSON_parse } from 'uint8array-json-parser';
import { isZstdCompressed, zstdDecompress } from './fzstdDecompress';


const resultParsers = {
  GetNormalizedExpression: (result) => result,
  DownloadAnnotSeuratObject: (result) => result,
  default: (result) => {
    // If result is a string, parse as JSON
    if (typeof result === 'string') {
      return JSON.parse(result);
    }
    // If result is Uint8Array, check for zstd
    if (result instanceof Uint8Array && isZstdCompressed(result)) {
      const decompressed = zstdDecompress(result);
      const text = new TextDecoder().decode(decompressed);
      return JSON.parse(text);
    }
    // If result is Uint8Array but not zstd, try to parse as text
    if (result instanceof Uint8Array) {
      const text = new TextDecoder().decode(result);
      return JSON.parse(text);
    }
    throw new Error('Unknown result format');
  },
};

const parseResult = async (result, taskName) => {
  const parser = resultParsers[taskName] ?? resultParsers.default;
  return parser(result);
};

export default parseResult;
