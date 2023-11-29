import { sampleTech } from 'utils/constants';

const fileNamesByTech = {
  [sampleTech['10X']]: ['features.tsv.gz', 'barcodes.tsv.gz', 'matrix.mtx.gz'],
  [sampleTech.H5]: ['matrix.h5.gz'],
  [sampleTech.SEURAT]: ['r.rds'],
  [sampleTech.RHAPSODY]: ['expression_data.st.gz'],
};

export default fileNamesByTech;
