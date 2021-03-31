import { createSample, updateSampleFile } from '../redux/actions/samples';

const processUpload = (filesList, sampleType, samples, activeProjectUuid, dispatch) => {
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
