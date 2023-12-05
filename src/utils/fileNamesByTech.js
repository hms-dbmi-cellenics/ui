import { sampleTech } from 'utils/constants';

const fileNamesByTech = {
  [sampleTech['10X']]: ['features10x', 'barcodes10x', 'matrix10x'],
  [sampleTech.H5]: ['10x_h5'],
  [sampleTech.SEURAT]: ['seurat'],
  [sampleTech.RHAPSODY]: ['rhapsody'],
};

export default fileNamesByTech;
