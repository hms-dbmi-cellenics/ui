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
    info: ` For each sample, upload a folder containing the 3 count matrix files. The 
    folder's name will be used to name the sample in it. You can change this name later in Data Management.`,
  },
  'BD Rhapsody': {
    acceptedFiles: new Set(['expression_matrix.mt']),
    requiredFiles: ['expression_matrix.mt'],
    inputInfo: [['expression_matrix.mt']],
    info: `Upload a folder for each sample. The folder's name will be used to name the sample in it. 
    You can change this name later in Data Management. Each folder must contain the following file:`,
  },

};

export default fileUploadSpecifications;
