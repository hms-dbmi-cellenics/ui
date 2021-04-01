import { Storage } from 'aws-amplify';
import pako from 'pako';
import { createSample, updateSampleFile } from '../redux/actions/samples';

const loadAndCompressIfNecessary = async (file, onLoaded) => {
  const format = file.name.split('.').pop();

  const reader = new FileReader();
  reader.onabort = () => console.log('file reading was aborted');
  reader.onerror = () => console.log('file reading has failed');
  reader.onload = () => {
    const loadedFile = reader.result;

    if (format !== 'gz') {
      onLoaded(loadedFile);
    } else {
      const compressed = pako.gzip(loadedFile, { to: 'string' });
      onLoaded(compressed);
    }
  };

  reader.readAsArrayBuffer(file.file);
};

const processUpload = (filesList, sampleType, samples, activeProjectUuid, dispatch) => {
  filesList.forEach(async (file) => {
    await loadAndCompressIfNecessary(file, async (loadedFile) => {
      await Storage.put(file.name, loadedFile)
        // await Storage.put(file.name, loadedFile)
        .then((result) => console.log(result))
        .catch((err) => console.log(err));
    });
  });

  const samplesMap = filesList.reduce((acc, file) => {
    const sampleName = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('/')[0];
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
          [sampleName]: file,
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

    Object.values(sample.files).forEach((file) => {
      dispatch(updateSampleFile(sample.uuid, {
        ...file,
        path: `${activeProjectUuid}/${file.name.replace(name, sample.uuid)}`,
      }));
    });
  });
};

export default processUpload;
