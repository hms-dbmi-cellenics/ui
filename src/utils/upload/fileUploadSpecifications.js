const fileUploadSpecifications = {
  '10X Chromium': {
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
    validMimeTypes: ['text/tsv', 'application/gzip', 'application/x-gzip', 'text/tab-separated-values'],
    validExtensionTypes: ['.mtx'],
    inputInfo: [
      ['features.tsv', 'features.tsv.gz', 'genes.tsv', 'genes.tsv.gz'],
      ['barcodes.tsv', 'barcodes.tsv.gz'],
      ['matrix.mtx', 'matrix.mtx.gz'],
    ],
    requiredFiles: [
      'features.tsv.gz',
      'barcodes.tsv.gz',
      'matrix.mtx.gz',
    ],
    fileUploadParagraphs: [
      'For each sample, upload a folder containing the 3 required files. The folder\'s name will be used to name the sample in it. You can change this name later in Data Management.',
      'The required files for each sample are:',
    ],
  },
  Seurat: {
    validMimeTypes: ['text/tsv', 'application/gzip', 'application/x-gzip', 'text/tab-separated-values'],
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['embedding'],
      ['counts'],
      ['clusters'],
      ['sample identity'],
    ],
    fileUploadParagraphs: [
      // eslint-disable-next-line
      <p>For your dataset, upload a single <code>*.rds</code> file with the Seurat object.</p>,
      // eslint-disable-next-line
      <p>The Seurat <code>object</code> must contain the following slots and metadata:</p>
    ],
  },

};

export default fileUploadSpecifications;
