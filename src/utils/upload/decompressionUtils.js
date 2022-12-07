import {
  DecodeUTF8, Decompress,
} from 'fflate';

const decode = async (arrBuffer) => {
  let result = '';
  const utfDecode = new DecodeUTF8((data) => { result += data; });
  utfDecode.push(new Uint8Array(arrBuffer));

  return result;
};

const decompress = async (arrBuffer) => {
  let result = '';
  const decompressor = new Decompress((chunk) => { result = chunk; });
  decompressor.push(new Uint8Array(arrBuffer));

  return result;
};

export { decode, decompress };
