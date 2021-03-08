const sampleTemplate = {
  name: null,
  uuid: null,
  type: null,
  species: null,
  createdDate: null,
  lastModified: null,
  complete: false,
  error: false,
  fileNames: [],
  files: {},
};

const sampleFileTemplate = {
  objectKey: '',
  name: null,
  size: 0,
  mime: '',
  success: false,
  error: false,
};

const initialState = {
  ids: [],
};

export default initialState;
export { sampleTemplate, sampleFileTemplate };
