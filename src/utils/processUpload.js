/* eslint-disable no-param-reassign */
import { Storage } from 'aws-amplify';
import _ from 'lodash';
import loadAndCompressIfNecessary from './loadAndCompressIfNecessary';
import { createSample, updateSampleFile } from '../redux/actions/samples';
import UploadStatus from './UploadStatus';

const putInS3 = (bucketKey, loadedFileData, dispatch, sampleUuid, fileName, metadata) => (
  Storage.put(
    bucketKey,
    loadedFileData,
    {
      metadata,
      progressCallback(progress) {
        const percentProgress = Math.round((progress.loaded / progress.total) * 100);

        dispatch(updateSampleFile(sampleUuid, fileName, {
          upload: {
            status: UploadStatus.UPLOADING,
            progress: percentProgress ?? 0,
          },
        }));
      },
    },
  )
);

const metadataForBundle = (bundle) => {
  const metadata = {};

  if (bundle.name.includes('genes')) {
    metadata.cellranger_version = 'v2';
  } else if (bundle.name.includes('features')) {
    metadata.cellranger_version = 'v3';
  }

  return metadata;
};

const compressAndUploadSingleFile = async (
  bucketKey, sampleUuid, fileName,
  bundle, dispatch, metadata = {},
) => {
  dispatch(
    updateSampleFile(
      sampleUuid,
      fileName,
      { bundle, upload: { status: UploadStatus.LOADING, progress: 0 } },
    ),
  );

  let loadedFile = null;

  try {
    loadedFile = await loadAndCompressIfNecessary(
      bundle,
      () => (
        dispatch(
          updateSampleFile(
            sampleUuid,
            fileName,
            { upload: { status: UploadStatus.COMPRESSING } },
          ),
        )
      ),
    );
  } catch (e) {
    const fileErrorStatus = e === 'aborted' ? UploadStatus.FILE_READ_ABORTED : UploadStatus.FILE_READ_ERROR;

    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        { upload: { status: fileErrorStatus } },
      ),
    );
  }

  try {
    await putInS3(bucketKey, loadedFile, dispatch, sampleUuid, fileName, metadata);
  } catch (e) {
    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        { upload: { status: UploadStatus.UPLOAD_ERROR } },
      ),
    );
  }

  dispatch(
    updateSampleFile(
      sampleUuid,
      fileName,
      { upload: { status: UploadStatus.UPLOADED } },
    ),
  );
};

const compressAndUpload = (sample, activeProjectUuid, dispatch) => {
  const updatedSampleFiles = Object.entries(sample.files).reduce((result, [fileName, file]) => {
    const uncompressed = !['application/gzip', 'application/x-gzip'].includes(file.bundle.type);

    const newFileName = uncompressed ? `${fileName}.gz` : fileName;
    const newFile = {
      ...file,
      name: newFileName,
    };

    result[newFileName] = newFile;

    return result;
  }, {});

  Object.entries(updatedSampleFiles).forEach(async ([fileName, file]) => {
    const bucketKey = `${activeProjectUuid}/${sample.uuid}/${fileName}`;

    const metadata = metadataForBundle(file.bundle);

    await compressAndUploadSingleFile(
      bucketKey, sample.uuid, fileName,
      file.bundle, dispatch, metadata,
    );
  });

  return updatedSampleFiles;
};

const processUpload = async (filesList, sampleType, samples, activeProjectUuid, dispatch) => {
  const samplesMap = filesList.reduce((acc, file) => {
    const pathToArray = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('/');

    const sampleName = pathToArray[0];
    let fileName = _.last(pathToArray);

    // We rename genes.tsv files to features.tsv (for a single entry)
    fileName = fileName.replace('genes', 'features');

    // Update the file name so that instead of being saved as
    // e.g. WT13/matrix.tsv.gz, we save it as matrix.tsv.gz
    file.name = fileName;

    const sampleUuid = Object.values(samples).filter(
      (s) => s.name === sampleName
        && s.projectUuid === activeProjectUuid,
    )[0]?.uuid;

    return {
      ...acc,
      [sampleName]: {
        ...acc[sampleName],
        uuid: sampleUuid,
        files: {
          ...acc[sampleName]?.files,
          [fileName]: file,
        },
      },
    };
  }, {});

  Object.entries(samplesMap).forEach(async ([name, sample]) => {
    // Create sample if not exists
    if (!sample.uuid) {
      sample.uuid = await dispatch(createSample(activeProjectUuid, name, sampleType));
    }

    sample.files = compressAndUpload(sample, activeProjectUuid, dispatch);

    Object.values(sample.files).forEach((file) => {
      // Create files
      dispatch(updateSampleFile(sample.uuid, file.name, {
        ...file,
        path: `${activeProjectUuid}/${file.name.replace(name, sample.uuid)}`,
      }));
    });
  });
};

export { compressAndUploadSingleFile, metadataForBundle };
export default processUpload;
