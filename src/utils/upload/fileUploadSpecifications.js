import { sampleTech } from 'utils/constants';
import sampleFileType from 'utils/sampleFileType';

const techNamesToDisplay = {
  [sampleTech['10X']]: '10X Chromium',
  [sampleTech.RHAPSODY]: 'BD Rhapsody',
  [sampleTech.SEURAT]: 'Seurat',
  [sampleTech.H5]: '10X Chromium - H5',
  [sampleTech.PARSE]: 'Parse Evercode',
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
    requiredFiles: [sampleFileType.BARCODES_10_X, sampleFileType.FEATURES_10_X, sampleFileType.MATRIX_10_X],
    fileUploadParagraphs: [
      'For each sample, upload a folder containing the 3 required files. The folder\'s name will be used to name the sample in it. You can change this name later in Data Management.',
      'The required files for each sample are:',
    ],
    dropzoneText: 'Drag and drop folders here or click to browse.',
    // setting to empty string allows folder upload on dropzone click
    webkitdirectory: '',
    isNameValid(fileName) { return matchFileName(fileName, this.acceptedFiles); },
    getCorrespondingType(fileName) {
      const fileNameToType = {
        'barcodes.tsv.gz': sampleFileType.BARCODES_10_X,
        'barcodes.tsv': sampleFileType.BARCODES_10_X,
        'features.tsv.gz': sampleFileType.FEATURES_10_X,
        'genes.tsv.gz': sampleFileType.FEATURES_10_X,
        'features.tsv': sampleFileType.FEATURES_10_X,
        'genes.tsv': sampleFileType.FEATURES_10_X,
        'matrix.mtx.gz': sampleFileType.MATRIX_10_X,
        'matrix.mtx': sampleFileType.MATRIX_10_X,
      };

      const allowedNames = Array.from(this.acceptedFiles);

      const name = allowedNames.find((allowedName) => fileName.endsWith(allowedName));

      return fileNameToType[name];
    },
  },
  [sampleTech.SEURAT]: {
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['<code>scdata$samples</code>: sample assignment. If absent, treated as unisample.'],
      ['<code>scdata[[\'RNA\']]@counts</code>: raw feature counts.'],
      ['<code>scdata@reductions</code>: contains the embeddings for <code>pca</code>, as well as either <code>umap</code> or <code>tsne</code>.'],
      ['<strong>Important notes on dimensionality reductions:</strong> ensure the default dimensionality reduction in your Seurat object is named exactly <code>umap</code> or <code>tsne</code>. If the default reduction name includes <code>umap</code> or <code>tsne</code> (e.g., <code>ref.umap</code>), it will be automatically renamed. If the default reduction is different and does not contain these names, the upload will not be successful.'],
      ['\uD83D\uDCA1cluster metadata in <code>scdata@meta.data</code> is auto-detected.'],
      ['\uD83D\uDCA1sample level metadata in <code>scdata@meta.data</code> that groups samples in <code>scdata$samples</code> is auto-detected for downstream analysis.'],
      ['\uD83D\uDCA1if file size is over 15GB, try removing any assays not indicated above.'],
    ],
    requiredFiles: ['seurat'],
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
    getCorrespondingType: () => 'seurat',
  },
  [sampleTech.RHAPSODY]: {
    acceptedFiles: new Set(['expression_data.st', 'expression_data.st.gz']),
    requiredFiles: ['rhapsody'],
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
    getCorrespondingType: () => 'rhapsody',
  },
  [sampleTech.H5]: {
    acceptedFiles: new Set(['matrix.h5', 'matrix.h5.gz']),
    inputInfo: [['<code>matrix.h5</code> or <code>matrix.h5.gz</code>']],
    requiredFiles: ['10x_h5'],
    fileUploadParagraphs: [`For each sample, upload a folder containing the h5 file. The folder's
    name will be used to name the sample in it.
    You can change this name later in Data Management.`],
    isNameValid: (fileName) => fileName.toLowerCase().match(/.*matrix.h5(.gz)?$/),
    getCorrespondingType: () => '10x_h5',
  },
  [sampleTech.PARSE]: {
    acceptedFiles: new Set([
      'all_genes.csv',
      'all_genes.csv.gz',
      'cell_metadata.csv',
      'cell_metadata.csv.gz',
      'DGE.mtx',
      'DGE.mtx.gz',
    ]),
    inputInfo: [
      ['<code>all_genes.csv</code> or <code>all_genes.csv.gz</code>'],
      ['<code>cell_metadata.csv</code> or <code>cell_metadata.csv.gz</code>'],
      ['<code>DGE.mtx</code> or <code>DGE.mtx.gz</code>'],
    ],
    requiredFiles: ['matrixParse', 'barcodesParse', 'featuresParse'],
    fileUploadParagraphs: [
      'For each sample, upload a folder containing the 3 required files. The folder\'s name will be used to name the sample in it. You can change this name later in Data Management.',
      'The required files for each sample are:',
    ],
    dropzoneText: 'Drag and drop folders here or click to browse.',
    // setting to empty string allows folder upload on dropzone click
    webkitdirectory: '',
    isNameValid(fileName) { return matchFileName(fileName, this.acceptedFiles); },
    getCorrespondingType(fileName) {
      const fileNameToType = {
        'all_genes.csv.gz': sampleFileType.FEATURES_PARSE,
        'all_genes.csv': sampleFileType.FEATURES_PARSE,
        'cell_metadata.csv.gz': sampleFileType.BARCODES_PARSE,
        'cell_metadata.csv': sampleFileType.BARCODES_PARSE,
        'DGE.mtx.gz': sampleFileType.MATRIX_PARSE,
        'DGE.mtx': sampleFileType.MATRIX_PARSE,
      };

      return fileNameToType[fileName];
    },
  },
};

export { techNamesToDisplay };
export default fileUploadSpecifications;
