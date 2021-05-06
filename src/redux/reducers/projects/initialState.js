const projectTemplate = {
  name: null,
  description: null,
  uuid: null,
  experimentId: null,
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
