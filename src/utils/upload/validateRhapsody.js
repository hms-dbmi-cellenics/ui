import {
  DecodeUTF8, Decompress,
} from 'fflate';
import SampleValidationError from 'utils/errors/upload/SampleValidationError';

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

const columnsToSearch = [['Cell_Index'], ['Bioproduct', 'Gene'], ['RSEC_Reads'], ['Raw_Molecules'], ['RSEC_Adjusted_Molecules'],
  ['DBEC_Reads'],
  ['DBEC_Adjusted_Molecules']];

const validateRhapsody = async (sample) => {
  const fileObjectKey = Object.keys(sample.files).filter((key) => key.toLowerCase().includes('expression_data.st'))[0];
  const { compressed, fileObject } = sample.files[fileObjectKey];
  const fileArrBuffer = await fileObject.slice(0, 800).arrayBuffer();

  const file = compressed
    ? await decode(await decompress(fileArrBuffer))
    : await decode(fileArrBuffer);

  const missingColumns = columnsToSearch.some((column) => (
    !column.some((subColumn) => file.includes(subColumn))
  ));
  if (missingColumns) {
    throw new SampleValidationError('.st file does not contain the required columns');
  }
};

export default validateRhapsody;
