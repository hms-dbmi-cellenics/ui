const experimentsMetadataCreate = (state, action) => {
  const { key, projectUuid } = action.payload;

  return {
    ...state,
    [projectUuid]: {
      ...state[projectUuid],
      metadataKeys: [
        ...state[projectUuid].metadataKeys,
        key,
      ],
    },
  };
};

export default experimentsMetadataCreate;
