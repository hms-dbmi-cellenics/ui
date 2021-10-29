const sampleTemplate = {
  name: null,
  projectUuid: null,
  uuid: null,
  type: null,
  species: null,
  createdDate: null,
  lastModified: null,
  complete: false,
  error: false,
  fileNames: [],
  files: {},
  metadata: {},
};

const sampleFileTemplate = {
  objectKey: '',
  name: null,
  size: 0,
  mime: '',
  path: '',
  success: false,
  error: false,
  lastModified: '',
  upload: {
    status: null,
    progressEmitter: null,
    cancelTokenSource: null,
  },
};

const initialState = {
  meta: {
    loading: false,
    error: false,
    saving: false,
  },
};

export default initialState;
export { sampleTemplate, sampleFileTemplate };
