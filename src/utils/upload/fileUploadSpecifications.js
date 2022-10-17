import { sampleTech } from 'utils/constants';

const techNames = {
  [sampleTech['10X']]: '10X Chromium',
  [sampleTech.RHAPSODY]: 'BD Rhapsody',
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
  },
  [sampleTech.RHAPSODY]: {
    acceptedFiles: new Set(['expression_data.st', 'expression_data.st.gz']),
    requiredFiles: [{ key: 'expression_data.st.gz', displayedName: 'expression_data.st' }],
    inputInfo: [['expression_data.st']],
    info: `Upload a folder for each sample. The folder's
    name will be used to name the sample in it.
    You can change this name later in Data Management.
    Each folder must contain the following file:`,
  },

};

export { techNames };
export default fileUploadSpecifications;
