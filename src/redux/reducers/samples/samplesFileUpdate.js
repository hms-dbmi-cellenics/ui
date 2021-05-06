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
  let newFile = { lastModified, ...fileDiff };
  if (oldFile) {
    newFile = _.mergeWith(oldFile, fileDiff, overwriteIfArray);
  }

  const newFileNames = _.clone(state[sampleUuid].fileNames);
  newFileNames.add(fileName);

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
