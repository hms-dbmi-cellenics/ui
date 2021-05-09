const projectTemplate = {
  name: null,
  description: null,
  metadataKeys: [],
  uuid: null,
  experiments: [],
  createdDate: null,
  lastModified: null,
  samples: [],
  lastAnalyzed: null,
};

const initialState = {
  ids: [],
  meta: {
    activeProjectUuid: null,
  },
};

export default initialState;
export { projectTemplate };
