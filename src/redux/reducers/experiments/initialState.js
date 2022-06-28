const experimentTemplate = {
  projectUuid: null,
  name: null,
  description: 'Analysis description',
  id: null,
  createdDate: null,
  notifyByEmail: true,
  meta: { organism: null, type: '10x' },
  sampleIds: [],
  metadataKeys: [],
};

const initialState = {
  meta: {
    loading: false,
    error: false,
    saving: false,
  },
  ids: [],
};

export default initialState;
export { experimentTemplate };
