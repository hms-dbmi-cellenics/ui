const projectTemplate = {
  name: null,
  description: null,
  metadataKeys: [],
  uuid: null,
  experiments: [],
  createdDate: null,
  lastModified: null,
  samples: new Set(),
  lastAnalyzed: null,
  toJSON() {
    return {
      ...this,
      samples: [...this.samples],
    };
  },
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
