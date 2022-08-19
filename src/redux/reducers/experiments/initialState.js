const experimentTemplate = {
  name: null,
  description: 'Analysis description',
  id: null,
  createdAt: null,
  updatedAt: null,
  notifyByEmail: true,
  meta: { organism: null, type: '10x' },
  sampleIds: [],
  metadataKeys: [],
  pipelineVersion: 1,
};

const initialState = {
  meta: {
    loading: false,
    error: false,
    saving: false,
    activeExperimentId: null,
  },
  ids: [],
};

const METADATA_DEFAULT_VALUE = 'N.A.';

export default initialState;
export { experimentTemplate, METADATA_DEFAULT_VALUE };
