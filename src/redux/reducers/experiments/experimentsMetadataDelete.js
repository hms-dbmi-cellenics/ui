const projectsMetadataDelete = (state, action) => {
  const { key, projectUuid } = action.payload;

  return {
    ...state,
    [projectUuid]: {
      ...state[projectUuid],
      metadataKeys: [
        ...state[projectUuid].metadataKeys.filter((value) => value !== key),
      ],
    },
  };
};

export default projectsMetadataDelete;
