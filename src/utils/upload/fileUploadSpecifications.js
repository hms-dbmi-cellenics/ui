import { sampleTech } from 'utils/constants';

const techNamesToDisplay = {
  [sampleTech['10X']]: '10X Chromium',
  [sampleTech.RHAPSODY]: 'BD Rhapsody',
  [sampleTech.SEURAT]: 'Seurat',
  [sampleTech.H5]: '10X Chromium - H5',
};

const matchFileName = (fileName, fileNames) => {
  const regexString = `.*(${Array.from(fileNames).join('|')})$`;
  const regexp = new RegExp(regexString, 'i');
  return regexp.test(fileName);
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
      ['<code>features.tsv</code> or <code>features.tsv.gz</code> or <code>genes.tsv</code> or <code>genes.tsv.gz</code>'],
      ['<code>barcodes.tsv</code> or <code>barcodes.tsv.gz</code>'],
      ['<code>matrix.mtx</code> or <code>matrix.mtx.gz</code>'],
    ],
    requiredFiles: [
      { key: 'barcodes.tsv.gz', displayedName: 'barcodes.tsv' },
      { key: 'features.tsv.gz', displayedName: 'genes.tsv' },
      { key: 'matrix.mtx.gz', displayedName: 'matrix.mtx' },
    ],
    fileUploadParagraphs: [
      'For each sample, upload a folder containing the 3 required files. The folder\'s name will be used to name the sample in it. You can change this name later in Data Management.',
      'The required files for each sample are:',
    ],
    dropzoneText: 'Drag and drop folders here or click to browse.',
    // setting to empty string allows folder upload on dropzone click
    webkitdirectory: '',
    isNameValid(fileName) { return matchFileName(fileName, this.acceptedFiles); },
    getCorrespondingName(fileName) {
      const allowedNames = Array.from(this.acceptedFiles);

      return allowedNames.find((allowedName) => fileName.endsWith(allowedName));
    },
  },
  [sampleTech.SEURAT]: {
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['<code>scdata$samples</code>: sample assignment. If absent, treated as unisample.'],
      ['<code>scdata[[\'RNA\']]@counts</code>: raw feature counts.'],
      ['<code>scdata@reductions</code>: contains the embbedings for <code>pca</code> as well as either <code>umap</code> or <code>tsne</code>.'],
      ['\uD83D\uDCA1cluster metadata in <code>scdata@meta.data</code> is auto-detected.'],
      ['\uD83D\uDCA1sample level metadata in <code>scdata@meta.data</code> that groups samples in <code>scdata$samples</code> is auto-detected for downstream analysis.'],
      ['\uD83D\uDCA1if file size is over 15GB, try removing any assays not indicated above.'],
    ],
    requiredFiles: [
      { key: 'r.rds', displayedName: 'seurat rds' },
    ],
    fileUploadParagraphs: [
      '<p>For your dataset, upload a single <code>*.rds</code> file with the Seurat object (max 15GB).</p>',
      '<p>The Seurat object must contain the following slots and metadata:</p>',
    ],
    dropzoneText: 'Drag and drop *.rds file here or click to browse.',
    // setting to null allows file upload on dropzone click
    webkitdirectory: null,
    isNameValid(fileName) {
      return this.validExtensionTypes.some(
        (validExtension) => fileName.endsWith(validExtension),
      );
    },
    getCorrespondingName: () => 'r.rds',
  },
  [sampleTech.RHAPSODY]: {
    acceptedFiles: new Set(['expression_data.st', 'expression_data.st.gz']),
    requiredFiles: [{ key: 'expression_data.st.gz', displayedName: 'expression_data.st' }],
    inputInfo: [
      ['<code>expression_data.st</code> or <code>expression_data.st.gz</code>'],
    ],
    fileUploadParagraphs: [
      `For each sample, upload a folder containing the required file. The folder's
      name will be used to name the sample in it.
      You can change this name later in Data Management.`,
    ],
    dropzoneText: 'Drag and drop folders here or click to browse.',
    webkitdirectory: '',
    isNameValid: (fileName) => fileName.toLowerCase().match(/.*expression_data.st(.gz)?$/),
    getCorrespondingName: (fileName) => fileName,
  },
  [sampleTech.H5]: {
    acceptedFiles: new Set(['matrix.h5', 'matrix.h5.gz']),
    requiredFiles: [{ key: 'matrix.h5.gz', displayedName: 'matrix.h5' }],
    inputInfo: [['<code>matrix.h5</code> or <code>matrix.h5.gz</code>']],
    fileUploadParagraphs: [`For each sample, upload a folder containing the h5 file. The folder's
    name will be used to name the sample in it.
    You can change this name later in Data Management.`],
    isNameValid: (fileName) => fileName.toLowerCase().match(/.*matrix.h5(.gz)?$/),
    getCorrespondingName: (fileName) => fileName,
  },
};

export { techNamesToDisplay };
export default fileUploadSpecifications;
