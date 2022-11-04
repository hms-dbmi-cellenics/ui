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
      ['<code>features.tsv</code> or <code>features.tsv.gz</code> or <code>genes.tsv</code> or <code>genes.tsv.gz</code>'],
      ['<code>barcodes.tsv</code> or <code>barcodes.tsv.gz</code>'],
      ['<code>matrix.mtx</code> or <code>matrix.mtx.gz</code>'],
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
    dropzoneText: 'Drag and drop folders here or click to browse.',
    // setting to empty string allows folder upload on dropzone click
    webkitdirectory: '',
  },
  Seurat: {
    validExtensionTypes: ['.rds'],
    inputInfo: [
      ['<code>HVFInfo(scdata)</code>: result of call to <code>FindVariableFeatures</code> or <code>SCTransform</code>.'],
      ['<code>scdata$seurat_clusters</code>: cluster assignment.'],
      ['<code>scdata$samples</code>: sample assignment. If absent, treated as unisample.'],
      ['<code>scdata[[\'RNA\']]@counts</code>: raw feature counts.'],
      ['<code>scdata[[\'RNA\']]@data</code>: log transformed counts.'],
      ['<code>scdata@reductions</code>: contains the embedding indicated by <code>DefaultDimReduc(scdata)</code>.'],
      ['sample level metadata in <code>scdata@meta.data</code> that groups samples in <code>scdata$samples</code> is auto-detected.'],
    ],
    requiredFiles: [
      'r.rds',
    ],
    fileUploadParagraphs: [
      '<p>For your dataset, upload a single <code>*.rds</code> file with the Seurat object.</p>',
      '<p>The Seurat object must contain the following slots and metadata:</p>',
    ],
    dropzoneText: 'Drag and drop *.rds file here or click to browse.',
    // setting to null allows file upload on dropzone click
    webkitdirectory: null,
  },

};

export default fileUploadSpecifications;
