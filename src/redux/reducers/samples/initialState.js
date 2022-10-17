import { technologies } from 'utils/upload/fileUploadSpecifications';

const sampleTemplate = {
  name: null,
  experimentId: null,
  uuid: null,
  type: null,
  createdDate: null,
  lastModified: null,
  complete: false,
  error: false,
  fileNames: [],
  files: {},
  metadata: {},
  options: {},
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
    amplifyPromise: null,
  },
};

const defaultSampleOptions = {
  [technologies.rhapsody]: {
    includeAbSeq: false,
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
export {
  sampleTemplate,
  sampleFileTemplate,
  defaultSampleOptions,
};
