const samplesFileUpdate = (state, action) => {
  const { sampleUuid, file, lastModified } = action.payload;

  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      fileNames: Array.from(new Set([...state[sampleUuid].fileNames, file.name])),
      files: {
        ...state[sampleUuid].files,
        [file.name]: file,
      },
      lastModified,
    },
  };
};

export default samplesFileUpdate;
