import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import downloadSingleFile from 'utils/data-management/downloadSingleFile';
import downloadFromUrl from 'utils/downloadFromUrl';

import fake from '__test__/test-utils/constants';

jest.mock('utils/downloadFromUrl');

enableFetchMocks();

describe('downloadFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Downloads from url', async () => {
    const mockSignedUrl = 'mockDownloadUrl';

    fetchMock.mockResponse(JSON.stringify(mockSignedUrl));

    const fileName = 'features.tsv.gz';

    await downloadSingleFile(fake.EXPERIMENT_ID, fake.SAMPLE_ID, fileName);

    expect(downloadFromUrl).toHaveBeenCalledWith(mockSignedUrl);
    expect(fetchMock.mock.calls).toMatchSnapshot();
  });
});
