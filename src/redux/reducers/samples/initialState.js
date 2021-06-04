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
  fileNames: new Set(),
  files: {},
  metadata: {},
  toJSON() {
    return {
      ...this,
      fileNames: [...this.fileNames],
    };
  },
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
