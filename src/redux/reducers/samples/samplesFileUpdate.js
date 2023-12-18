import _ from 'lodash';

const samplesFileUpdate = (state, action) => {
  const {
    sampleUuid, sampleFileType, fileDiff, lastModified,
  } = action.payload;

  // There's a possible race condition where a file update can reach this place
  // after a sample is deleted and there's a crash. This check is in place to avoid that error.
  if (_.isNil(state[sampleUuid])) {
    return state;
  }

  const oldFile = state[sampleUuid].files?.[sampleFileType];
  let newFile = fileDiff;

  if (oldFile) {
    newFile = _.merge({}, oldFile, fileDiff);
  }

  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      files: {
        ...state[sampleUuid].files,
        [sampleFileType]: {
          ...newFile,
        },
      },
      lastModified,
    },
  };
};

export default samplesFileUpdate;
