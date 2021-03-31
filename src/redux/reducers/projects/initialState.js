const projectTemplate = {
  name: null,
  description: null,
  uuid: null,
  createdDate: null,
  lastModified: null,
  samples: [],
  lastAnalyzed: null,
  experiments: [],
};

const initialState = {
  ids: [],
  meta: {
    activeProject: null,
  },
};

export default initialState;
export { projectTemplate };
