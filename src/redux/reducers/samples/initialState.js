import { sampleTech } from 'utils/constants';

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
  [sampleTech.RHAPSODY]: {
    includeAbSeq: false,
  },
};

const initialState = {
  meta: {
    loading: false,
    error: false,
    saving: false,
    validating: [],
  },
};

export default initialState;
export {
  sampleTemplate,
  sampleFileTemplate,
  defaultSampleOptions,
};
