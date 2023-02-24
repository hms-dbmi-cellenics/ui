import { sampleTech } from 'utils/constants';

const techNamesToDisplay = {
  [sampleTech['10X']]: '10X Chromium',
  [sampleTech.RHAPSODY]: 'BD Rhapsody',
};

const matchFileName = (fileName, fileNames) => {
  const regexString = `.*(${Array.from(fileNames).join('|')})$`;
  const regexp = new RegExp(regexString, 'i');
  return fileName.match(regexp);
};

/* eslint-disable max-len */
const fileUploadSpecifications = {
  [sampleTech['10X']]: {
    acceptedFiles: new Set([
      'barcodes.tsv',
      'barcodes.tsv.gz',
      'features.tsv',
      'features.tsv.gz',
      'genes.tsv',
      'genes.tsv.gz',
      'matrix.mtx',
      'matrix.mtx.gz',
    ]),
    inputInfo: [
      ['features.tsv', 'features.tsv.gz', 'genes.tsv', 'genes.tsv.gz'],
      ['barcodes.tsv', 'barcodes.tsv.gz'],
      ['matrix.mtx', 'matrix.mtx.gz'],
    ],
    requiredFiles: [
      { key: 'barcodes.tsv.gz', displayedName: 'barcodes.tsv' },
      { key: 'features.tsv.gz', displayedName: 'genes.tsv' },
      { key: 'matrix.mtx.gz', displayedName: 'matrix.mtx' },
    ],
    info: ` For each sample, upload a folder containing the 3 count matrix files. The
    folder's name will be used to name the sample in it. You can change this name later in Data Management.`,
    isNameValid(fileName) { return this.acceptedFiles.has(fileName) || matchFileName(fileName, this.acceptedFiles); },
    getCorrespondingName(fileName) {
      const allowedNames = Array.from(this.acceptedFiles);

      // Using for loop to allow breaking quickly
      for (let i = 0; i < allowedNames.length; i += 1) {
        if (fileName.endsWith(allowedNames[i])) return allowedNames[i];
      }
    },
  },
  [sampleTech.RHAPSODY]: {
    acceptedFiles: new Set(['expression_data.st', 'expression_data.st.gz']),
    requiredFiles: [{ key: 'expression_data.st.gz', displayedName: 'expression_data.st' }],
    inputInfo: [['expression_data.st', 'expression_data.st.gz']],
    info: `For each sample, upload a folder containing the required file. The folder's
    name will be used to name the sample in it.
    You can change this name later in Data Management.`,
    isNameValid: (fileName) => fileName.toLowerCase().match(/.*expression_data.st(.gz)?$/),
    getCorrespondingName: (fileName) => fileName,
  },
};

export { techNamesToDisplay };
export default fileUploadSpecifications;
