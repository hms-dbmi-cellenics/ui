import _ from 'lodash';

const samplesFileUpdate = (state, action) => {
  const {
    sampleUuid, fileName, fileDiff, lastModified,
  } = action.payload;

  const overwriteIfArray = (objValue, srcValue) => {
    if (_.isArray(objValue) && srcValue) {
      return srcValue;
    }
  };

  const oldFile = state[sampleUuid].files?.[fileName];
  let newFile = fileDiff;

  if (oldFile) {
    newFile = _.mergeWith(oldFile, fileDiff, overwriteIfArray);
  }

  const newFileNames = _.cloneDeep(state[sampleUuid].fileNames);
  if (!newFileNames.includes(fileName)) {
    newFileNames.push(fileName);
  }

  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      fileNames: newFileNames,
      files: {
        ...state[sampleUuid].files,
        [fileName]: {
          ...newFile,
          lastModified,
        },
      },
      lastModified,
    },
  };
};

export default samplesFileUpdate;
