import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { downloadSampleFile, getSampleFileUrls, clearSampleFileUrlCache } from 'utils/data-management/downloadSampleFile';
import downloadFromUrl from 'utils/downloadFromUrl';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

import fake from '__test__/test-utils/constants';
import sampleFileType from 'utils/sampleFileType';

jest.mock('utils/downloadFromUrl');

enableFetchMocks();

describe('downloadFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
    clearSampleFileUrlCache();
  });

  it('Downloads from url', async () => {
    const mockSignedUrl = [{ url: 'mockDownloadUrl', fileId: 'fake-file-id' }];

    fetchMock.mockResponse(JSON.stringify(mockSignedUrl));

    await downloadSampleFile(fake.EXPERIMENT_ID, fake.SAMPLE_ID, sampleFileType.FEATURES_10_X);

    expect(downloadFromUrl).toHaveBeenCalledWith(mockSignedUrl[0].url);
    expect(fetchMock.mock.calls).toMatchSnapshot();
  });

  it('Caches signed urls per sample and file type', async () => {
    const mockSignedUrl = [{ url: 'mockDownloadUrl', fileId: 'fake-file-id' }];
    fetchMock.mockResponse(JSON.stringify(mockSignedUrl));

    const first = await getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'ome_zarr_zip');
    const second = await getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'ome_zarr_zip');
    await getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'segmentations_ome_zarr_zip');

    expect(first).toEqual(mockSignedUrl);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    clearSampleFileUrlCache();
    await getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'ome_zarr_zip');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('Does not cache failed url requests', async () => {
    fetchMock.mockResponseOnce('', { status: 404 });
    await expect(getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'ome_zarr_zip')).rejects.toBeTruthy();

    fetchMock.mockResponseOnce(JSON.stringify([{ url: 'mockDownloadUrl' }]));
    await expect(getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'ome_zarr_zip')).resolves.toEqual([{ url: 'mockDownloadUrl' }]);
  });

  it('Re-signs urls after the cache ttl', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(0);
    fetchMock.mockResponse(JSON.stringify([{ url: 'mockDownloadUrl' }]));

    await getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'ome_zarr_zip');
    now.mockReturnValue(13 * 60 * 60 * 1000);
    await getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'ome_zarr_zip');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  it('Always fetches a fresh url for downloads', async () => {
    fetchMock.mockResponse(JSON.stringify([{ url: 'mockDownloadUrl' }]));

    await downloadSampleFile(fake.EXPERIMENT_ID, fake.SAMPLE_ID, sampleFileType.FEATURES_10_X);
    await downloadSampleFile(fake.EXPERIMENT_ID, fake.SAMPLE_ID, sampleFileType.FEATURES_10_X);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Registers zip sizes so spatial zips can be range-read', async () => {
    const registerSpy = jest.spyOn(ZipFileStore, 'registerSize');
    fetchMock.mockResponse(JSON.stringify([{ url: 'mockDownloadUrl', fileId: 'id', size: 1234 }]));

    await getSampleFileUrls(fake.EXPERIMENT_ID, fake.SAMPLE_ID, 'segmentations_ome_zarr_zip');

    expect(registerSpy).toHaveBeenCalledWith('mockDownloadUrl', 1234);
    registerSpy.mockRestore();
  });
});
