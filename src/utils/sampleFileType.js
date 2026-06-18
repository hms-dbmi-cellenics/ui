const sampleFileType = {
  BARCODES_10_X: 'barcodes10x',
  FEATURES_10_X: 'features10x',
  MATRIX_10_X: 'matrix10x',
  H5_10_X: '10x_h5',
  SEURAT_OBJECT: 'seurat_object',
  SEURAT_SPATIAL_OBJECT: 'seurat_spatial_object',
  SCE_OBJECT: 'sce_object',
  ANNDATA_OBJECT: 'anndata_object',
  RHAPSODY: 'rhapsody',
  FEATURES_PARSE: 'featuresParse',
  BARCODES_PARSE: 'barcodesParse',
  MATRIX_PARSE: 'matrixParse',
  VISIUM_HD_FILTERED_FEATURE_CELL_MATRIX: 'visium_hd_filtered_feature_cell_matrix',
  VISIUM_HD_CELL_SEGMENTATIONS: 'visium_hd_cell_segmentations',
  VISIUM_HD_TISSUE_HIRES_IMAGE: 'visium_hd_tissue_hires_image',
  VISIUM_HD_SCALEFACTORS_JSON: 'visium_hd_scalefactors_json',
  XENIUM_CELL_FEATURE_MATRIX: 'xenium_cell_feature_matrix',
  XENIUM_CELLS: 'xenium_cells',
  XENIUM_CELL_BOUNDARIES: 'xenium_cell_boundaries',
};

const fileTypeToDisplay = {
  [sampleFileType.BARCODES_10_X]: 'barcodes.tsv',
  [sampleFileType.FEATURES_10_X]: 'genes.tsv',
  [sampleFileType.MATRIX_10_X]: 'matrix.mtx',
  [sampleFileType.H5_10_X]: 'matrix.h5',
  [sampleFileType.SEURAT_OBJECT]: 'Seurat RDS',
  [sampleFileType.SEURAT_SPATIAL_OBJECT]: 'Seurat RDS',
  [sampleFileType.SCE_OBJECT]: 'SingleCellExperiment RDS',
  [sampleFileType.ANNDATA_OBJECT]: 'AnnData H5ad',
  [sampleFileType.FEATURES_PARSE]: 'all_genes.csv',
  [sampleFileType.BARCODES_PARSE]: 'cell_metadata.csv',
  [sampleFileType.MATRIX_PARSE]: 'count_matrix.mtx',
  [sampleFileType.VISIUM_HD_FILTERED_FEATURE_CELL_MATRIX]: 'filtered_feature_cell_matrix.h5',
  [sampleFileType.VISIUM_HD_CELL_SEGMENTATIONS]: 'cell_segmentations.geojson',
  [sampleFileType.VISIUM_HD_TISSUE_HIRES_IMAGE]: 'tissue_hires_image.png',
  [sampleFileType.VISIUM_HD_SCALEFACTORS_JSON]: 'scalefactors_json.json',
  [sampleFileType.XENIUM_CELL_FEATURE_MATRIX]: 'cell_feature_matrix.h5',
  [sampleFileType.XENIUM_CELLS]: 'cells.parquet',
  [sampleFileType.XENIUM_CELL_BOUNDARIES]: 'cell_boundaries.parquet',
};

const fileTypeColumnWidth = {
  [sampleFileType.VISIUM_HD_FILTERED_FEATURE_CELL_MATRIX]: 240,
  [sampleFileType.VISIUM_HD_CELL_SEGMENTATIONS]: 220,
  [sampleFileType.VISIUM_HD_TISSUE_HIRES_IMAGE]: 195,
  [sampleFileType.VISIUM_HD_SCALEFACTORS_JSON]: 185,
  [sampleFileType.XENIUM_CELL_FEATURE_MATRIX]: 215,
  [sampleFileType.XENIUM_CELLS]: 150,
  [sampleFileType.XENIUM_CELL_BOUNDARIES]: 195,
};

export default sampleFileType;

export { fileTypeToDisplay, fileTypeColumnWidth };
