const projectTemplate = {
  name: null,
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
