import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';

// Signed urls of a spatial sample file type, each with the sample it belongs to.
// An obj2s experiment has a single sample holding the files of every sample cell
// set, so its files are linked to their sample cell set by obj2sSampleId (images
// uploaded before files were linked use the sample cell set id as file id).
// Optional file types resolve to no files for samples that don't have them.
const getSpatialFileUrls = async (
  experimentId, sampleIds, fileType, isObj2s, { optional = false } = {},
) => {
  const results = await Promise.all(sampleIds.map(async (sampleId) => {
    const request = getSampleFileUrls(experimentId, sampleId, fileType);
    const files = optional ? await request.catch(() => []) : await request;

    return (files ?? []).map((file) => ({
      ...file,
      sampleId: isObj2s ? (file.obj2sSampleId ?? file.fileId) : sampleId,
    }));
  }));

  return results.flat();
};

// urls of files ordered as sampleIds, null for samples without one
const alignFileUrls = (files, sampleIds) => sampleIds.map(
  (sampleId) => files.find((file) => file.sampleId === sampleId)?.url ?? null,
);

// the spatial technology of an experiment's first sample. Spatial objects are
// all uploaded as seurat_spatial_object, obj2s saves the detected technology
// (e.g. xenium) on the sample options
const getSpatialTechnology = (sample) => sample?.options?.spatialTechnology ?? sample?.type;

export { getSpatialFileUrls, alignFileUrls, getSpatialTechnology };
