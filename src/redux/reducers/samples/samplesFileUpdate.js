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

  newFile.lastModified = lastModified;

  const newFileNames = Array.from(new Set([...state[sampleUuid].fileNames, fileName]));
  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      fileNames: newFileNames,
      files: {
        ...state[sampleUuid].files,
        [fileName]: newFile,
      },
      lastModified,
    },
  };
};

export default samplesFileUpdate;
