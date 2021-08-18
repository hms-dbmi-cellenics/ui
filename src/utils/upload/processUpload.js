/* eslint-disable no-param-reassign */
import { Storage } from 'aws-amplify';
import _ from 'lodash';
import loadAndCompressIfNecessary from './loadAndCompressIfNecessary';
import { createSample, updateSampleFile } from '../../redux/actions/samples';
import UploadStatus from './UploadStatus';
import { inspectFile, Verdict } from './fileInspector';

const putInS3 = async (bucketKey, loadedFileData, dispatch, sampleUuid, fileName, metadata) => (
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
  bucketKey, sampleUuid, fileName, file,
  dispatch, metadata = {},
) => {
  let loadedFile = null;

  try {
    loadedFile = await loadAndCompressIfNecessary(file, () => (
      dispatch(
        updateSampleFile(
          sampleUuid,
          fileName,
          { upload: { status: UploadStatus.COMPRESSING } },
        ),
      )
    ));
  } catch (e) {
    const fileErrorStatus = e === 'aborted' ? UploadStatus.FILE_READ_ABORTED : UploadStatus.FILE_READ_ERROR;

    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        { upload: { status: fileErrorStatus } },
      ),
    );

    return;
  }

  try {
    const uploadPromise = putInS3(
      bucketKey, loadedFile, dispatch,
      sampleUuid, fileName, metadata,
    );

    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        {
          bundle: file.bundle,
          upload: { status: UploadStatus.UPLOADING, amplifyPromise: uploadPromise },
        },
      ),
    );

    await uploadPromise;
  } catch (e) {
    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        { upload: { status: UploadStatus.UPLOAD_ERROR, amplifyPromise: null } },
      ),
    );

    return;
  }

  dispatch(
    updateSampleFile(
      sampleUuid,
      fileName,
      {
        upload: {
          status: UploadStatus.UPLOADED,
          progress: 100,
          amplifyPromise: null,
        },
      },
    ),
  );
};

const renameFileIfNeeded = (fileName, type) => {
  // rename files to include .gz
  const uncompressed = !['application/gzip', 'application/x-gzip'].includes(type) && !fileName.endsWith('.gz');
  let newFileName = uncompressed ? `${fileName}.gz` : fileName;

  // We rename genes.tsv files to features.tsv (for a single entry)
  newFileName = newFileName.replace('genes', 'features');

  return newFileName;
};

const uploadSingleFile = (newFile, activeProjectUuid, sampleUuid, dispatch) => {
  const metadata = metadataForBundle(newFile);

  const newFileName = renameFileIfNeeded(newFile.bundle.name, newFile.bundle.type);

  const bucketKey = `${activeProjectUuid}/${sampleUuid}/${newFileName}`;

  compressAndUploadSingleFile(bucketKey, sampleUuid, newFileName, newFile, dispatch, metadata);

  return [newFileName, { ...newFile, name: newFileName }];
};

const compressAndUpload = (sample, activeProjectUuid, dispatch) => Object.fromEntries(
  Object.values(sample.files)
    .map((file) => uploadSingleFile(file, activeProjectUuid, sample.uuid, dispatch)),
);

const processUpload = async (filesList, sampleType, samples, activeProjectUuid, dispatch) => {
  const samplesMap = filesList.reduce((acc, file) => {
    const pathToArray = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('/');

    const sampleName = pathToArray[0];
    const fileName = _.last(pathToArray);

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
    sample.uuid ??= await dispatch(createSample(activeProjectUuid, name, sampleType));

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

const bundleToFile = async (bundle, technology) => {
  // This is the first stage in uploading a file.

  let filename;
  if (bundle.path) {
    // trim path to just the file and its folder
    filename = _.takeRight(bundle.path.split('/'), 2).join('/');
  } else {
    filename = bundle.name;
  }

  const verdict = await inspectFile(bundle, technology);

  let error = '';
  if (verdict === Verdict.INVALID_NAME) {
    error = 'Invalid file name.';
  } else if (verdict === Verdict.INVALID_FORMAT) {
    error = 'Invalid file format.';
  }

  return {
    name: filename,
    bundle,
    upload: {
      status: UploadStatus.UPLOADING,
      progress: 0,
    },
    valid: !error,
    errors: error,
    compressed: verdict === Verdict.VALID_ZIPPED,
  };
};

export {
  bundleToFile,
  uploadSingleFile,
  processUpload,
};
