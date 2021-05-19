const fileUploadSpecifications = {
  '10X Chromium': {
    acceptedFiles: [
      'barcodes.tsv',
      'barcodes.tsv.gz',
      'features.tsv',
      'features.tsv.gz',
      'genes.tsv',
      'genes.tsv.gz',
      'matrix.mtx',
      'matrix.mtx.gz',
    ],
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
  },

};

export default fileUploadSpecifications;
