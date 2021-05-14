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
    loading: true,
    error: false,
    saving: false,
  },
};

export default initialState;
export { projectTemplate };
