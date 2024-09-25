const sampleFileType = {
  BARCODES_10_X: 'barcodes10x',
  FEATURES_10_X: 'features10x',
  MATRIX_10_X: 'matrix10x',
  H5_10_X: '10x_h5',
  SEURAT_OBJECT: 'seurat_object',
  SCE_OBJECT: 'sce_object',
  ANNDATA_OBJECT: 'anndata_object',
  RHAPSODY: 'rhapsody',
  FEATURES_PARSE: 'featuresParse',
  BARCODES_PARSE: 'barcodesParse',
  MATRIX_PARSE: 'matrixParse',
};

const fileTypeToDisplay = {
  [sampleFileType.BARCODES_10_X]: 'barcodes.tsv',
  [sampleFileType.FEATURES_10_X]: 'genes.tsv',
  [sampleFileType.MATRIX_10_X]: 'matrix.mtx',
  [sampleFileType.H5_10_X]: 'matrix.h5',
  [sampleFileType.SEURAT_OBJECT]: 'Seurat RDS',
  [sampleFileType.SCE_OBJECT]: 'SingleCellExperiment RDS',
  [sampleFileType.ANNDATA_OBJECT]: 'AnnData H5ad',
  [sampleFileType.FEATURES_PARSE]: 'all_genes.csv',
  [sampleFileType.BARCODES_PARSE]: 'cell_metadata.csv',
  [sampleFileType.MATRIX_PARSE]: 'count_matrix.mtx',
};

export default sampleFileType;

export { fileTypeToDisplay };
