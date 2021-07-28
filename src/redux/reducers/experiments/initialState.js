const experimentTemplate = {
  projectUuid: null,
  name: null,
  description: 'Analysis description',
  id: null,
  createdDate: null,
  lastViewed: null,
  meta: { organism: null, type: '10x' },
};

const initialState = {
  meta: {
    loading: false,
    error: false,
    saving: false,
    download: {},
  },
  ids: [],
};

export default initialState;
export { experimentTemplate };
