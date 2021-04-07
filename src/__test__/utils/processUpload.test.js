import processUpload from '../../utils/processUpload';

jest.mock('pako');
jest.mock('aws-amplify');

describe('processUpload', () => {
  const filesList = [];
  const sampleType = null;
  const samples = [];
  const activeProjectUuid = null;
  const dispatch = null;

  it('Uploads and updates redux correctly when there are no errors', () => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
  });
});
