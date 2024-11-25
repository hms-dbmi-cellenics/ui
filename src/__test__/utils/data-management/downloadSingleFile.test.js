import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { downloadSampleFile } from 'utils/data-management/downloadSampleFile';
import downloadFromUrl from 'utils/downloadFromUrl';

import fake from '__test__/test-utils/constants';
import sampleFileType from 'utils/sampleFileType';

jest.mock('utils/downloadFromUrl');

enableFetchMocks();

describe('downloadFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Downloads from url', async () => {
    const mockSignedUrl = [{ url: 'mockDownloadUrl', fileId: 'fake-file-id' }];

    fetchMock.mockResponse(JSON.stringify(mockSignedUrl));

    await downloadSampleFile(fake.EXPERIMENT_ID, fake.SAMPLE_ID, sampleFileType.FEATURES_10_X);

    expect(downloadFromUrl).toHaveBeenCalledWith(mockSignedUrl[0].url);
    expect(fetchMock.mock.calls).toMatchSnapshot();
  });
});
