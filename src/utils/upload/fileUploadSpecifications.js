import { sampleTech } from 'utils/constants';

const techNamesToDisplay = {
  [sampleTech['10X']]: '10X Chromium',
  [sampleTech.RHAPSODY]: 'BD Rhapsody',
  [sampleTech.SEURAT]: 'Seurat',
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
  },
  [sampleTech.SEURAT]: {
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['<code>HVFInfo(scdata)</code>: result of call to <code>FindVariableFeatures</code> or <code>SCTransform</code>.'],
      ['<code>scdata$seurat_clusters</code>: cluster assignment.'],
      ['<code>scdata$samples</code>: sample assignment. If absent, treated as unisample.'],
      ['<code>scdata[[\'RNA\']]@counts</code>: raw feature counts.'],
      ['<code>scdata[[\'RNA\']]@data</code>: log transformed counts.'],
      ['<code>scdata@reductions</code>: contains the <code>pca</code> embedding as well as the embedding indicated by <code>DefaultDimReduc(scdata)</code>.'],
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
  },

};

export { techNamesToDisplay };
export default fileUploadSpecifications;
