const experimentTemplate = {
  projectUuid: null,
  name: null,
  description: null,
  id: null,
  createdAt: null,
  lastViewed: null,
};

const initialState = {
  meta: {
    error: false,
  },
  ids: [],
};

export default initialState;
export { experimentTemplate };
