import { Storage } from 'aws-amplify';
import pako from 'pako';
import _ from 'lodash';
import { createSample, updateSampleFile } from '../redux/actions/samples';

const loadAndCompressIfNecessary = async (fileName, file, onLoaded) => {
  const inGzipFormat = file.mime === 'application/gzip';

  const reader = new FileReader();
  reader.onabort = () => console.log('file reading was aborted');
  reader.onerror = () => console.log('file reading has failed');
  reader.onload = () => {
    const loadedFile = reader.result;

    if (inGzipFormat) {
      onLoaded(loadedFile, fileName);
    } else {
      const compressed = pako.gzip(loadedFile, { to: 'string' });
      onLoaded(compressed, `${fileName}.gz`);
    }
  };

  reader.readAsArrayBuffer(file.file);
};

const compressAndUpload = async (sample, activeProjectUuid) => {
  Object.entries(sample.files).map(async ([fileName, file]) => {
    loadAndCompressIfNecessary(
      fileName,
      file,
      async (loadedFile, updatedFileName) => {
        const bucketKey = `${activeProjectUuid}/${sample.uuid}/${updatedFileName}`;

        return Storage.put(bucketKey, loadedFile)
          .then(() => { })
          .catch((err) => console.log(err));
      },
    );
  });
};

const processUpload = (filesList, sampleType, samples, activeProjectUuid, dispatch) => {
  const samplesMap = filesList.reduce((acc, file) => {
    const pathToArray = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('/');

    const sampleName = pathToArray[0];
    const fileName = _.last(pathToArray);

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
      // eslint-disable-next-line no-param-reassign
      sample.uuid = await dispatch(createSample(activeProjectUuid, name, sampleType));
    }

    compressAndUpload(sample, activeProjectUuid);

    Object.values(sample.files).forEach((file) => {
      dispatch(updateSampleFile(sample.uuid, {
        ...file,
        path: `${activeProjectUuid}/${file.name.replace(name, sample.uuid)}`,
      }));
    });
  });
};

export default processUpload;
