/* eslint-disable no-param-reassign */
import { Storage } from 'aws-amplify';
import pako from 'pako';
import _ from 'lodash';
import { createSample, updateSampleFile } from '../redux/actions/samples';
import UploadStatus from './UploadStatus';

const loadAndCompressIfNecessary = async (file, onLoaded, onError) => {
  const inGzipFormat = file.bundle.mime === 'application/gzip';

  const reader = new FileReader();
  reader.onabort = () => onError();
  reader.onerror = () => onError();
  reader.onload = () => {
    const loadedFile = reader.result;

    if (inGzipFormat) {
      onLoaded(loadedFile);
    } else {
      const compressed = pako.gzip(loadedFile, { to: 'string' });
      onLoaded(compressed);
    }
  };

  reader.readAsArrayBuffer(file.bundle);
};

const compressAndUpload = async (sample, activeProjectUuid, dispatch) => {
  const updatedSampleFiles = Object.entries(sample.files).reduce((result, [fileName, file]) => {
    const uncompressed = file.bundle.type !== 'application/gzip';

    const newFileName = uncompressed ? `${fileName}.gz` : fileName;
    const newFile = {
      ...file,
      name: newFileName,
    };

    result[newFileName] = newFile;

    return result;
  }, {});

  Object.entries(updatedSampleFiles).map(async ([fileName, file]) => {
    loadAndCompressIfNecessary(
      file,
      async (loadedFile) => {
        const bucketKey = `${activeProjectUuid}/${sample.uuid}/${fileName}`;

        return Storage.put(bucketKey, loadedFile)
          .then(() => {
            dispatch(updateSampleFile(sample.uuid, {
              ...file,
              status: UploadStatus.UPLOADED,
            }));
          })
          .catch(() => {
            dispatch(updateSampleFile(sample.uuid, {
              ...file,
              status: UploadStatus.UPLOAD_ERROR,
            }));
          });
      },
      async () => {
        dispatch(updateSampleFile(sample.uuid, {
          ...file,
          status: UploadStatus.UPLOAD_ERROR,
        }));
      },
    );
  });

  return updatedSampleFiles;
};

const processUpload = (filesList, sampleType, samples, activeProjectUuid, dispatch) => {
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
    if (!sample.uuid) {
      sample.uuid = await dispatch(createSample(activeProjectUuid, name, sampleType));
    }

    sample.files = compressAndUpload(sample, activeProjectUuid, dispatch);

    Object.values(sample.files).forEach((file) => {
      dispatch(updateSampleFile(sample.uuid, {
        ...file,
        path: `${activeProjectUuid}/${file.name.replace(name, sample.uuid)}`,
      }));
    });
  });
};

export default processUpload;
