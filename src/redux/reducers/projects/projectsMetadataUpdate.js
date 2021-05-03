const projectsMetadataUpdate = (state, action) => {
  const { oldKey, newKey, projectUuid } = action.payload;

  return {
    ...state,
    [projectUuid]: {
      ...state[projectUuid],
      metadataKeys: [
        ...state[projectUuid].metadataKeys.filter((value) => value !== oldKey),
        newKey,
      ],
    },
  };
};

export default projectsMetadataUpdate;
