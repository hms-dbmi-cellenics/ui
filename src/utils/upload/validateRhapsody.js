import { decode, decompress } from 'utils/upload/decompressionUtils';
import SampleValidationError from 'utils/errors/upload/SampleValidationError';

const columnsToSearch = [
  ['Cell_Index'], ['Bioproduct', 'Gene'], ['DBEC_Adjusted_Molecules', 'RSEC_Adjusted_Molecules'],
];

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
