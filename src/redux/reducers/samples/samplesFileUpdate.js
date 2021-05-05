import _ from 'lodash';

const samplesFileUpdate = (state, action) => {
  const { sampleUuid, file, lastModified } = action.payload;

  const newFileNames = _.clone(state[sampleUuid].fileNames);
  newFileNames.add(file.name);

  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      fileNames: newFileNames,
      files: {
        ...state[sampleUuid].files,
        [file.name]: file,
      },
      lastModified,
    },
  };
};

export default samplesFileUpdate;
