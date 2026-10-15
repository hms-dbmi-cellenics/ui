import { clearSampleFileUrlCache } from 'utils/data-management/downloadSampleFile';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';
import { clearPyramidCache } from 'components/plots/zarrPyramid';
import { clearSpatialTileCache } from 'components/plots/spatialTileCache';

// Spatial images and segmentations are cached in memory across page switches
// (signed urls, zip stores, opened pyramids, decoded tiles). gem2s/obj2s rewrite
// those files, so drop everything when either pipeline reports progress.
const clearSpatialCaches = () => {
  clearSampleFileUrlCache();
  ZipFileStore.clearCache();
  clearPyramidCache();
  clearSpatialTileCache();
};

export default clearSpatialCaches;
