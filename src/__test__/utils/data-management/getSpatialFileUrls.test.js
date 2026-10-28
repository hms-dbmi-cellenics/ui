import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import {
  getSpatialFileUrls, alignFileUrls, getSpatialTechnology,
} from 'utils/data-management/getSpatialFileUrls';

jest.mock('utils/data-management/downloadSampleFile', () => ({
  getSampleFileUrls: jest.fn(),
}));

describe('getSpatialFileUrls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('assigns files to the sample they belong to', async () => {
    getSampleFileUrls.mockImplementation((experimentId, sampleId) => Promise.resolve([
      { url: `url-${sampleId}`, fileId: `file-${sampleId}` },
    ]));

    const files = await getSpatialFileUrls('experimentId', ['sampleA', 'sampleB'], 'ome_zarr_zip', false);

    expect(getSampleFileUrls).toHaveBeenCalledWith('experimentId', 'sampleA', 'ome_zarr_zip');
    expect(files.map(({ url, sampleId }) => [url, sampleId])).toEqual([
      ['url-sampleA', 'sampleA'],
      ['url-sampleB', 'sampleB'],
    ]);
  });

  it('assigns obj2s files to their linked sample cell set', async () => {
    getSampleFileUrls.mockResolvedValue([
      { url: 'url1', fileId: 'file1', obj2sSampleId: 'cellSetB' },
      { url: 'url2', fileId: 'file2', obj2sSampleId: 'cellSetA' },
    ]);

    const files = await getSpatialFileUrls('experimentId', ['obj2sSample'], 'segmentations_ome_zarr_zip', true);

    expect(files.map(({ sampleId }) => sampleId)).toEqual(['cellSetB', 'cellSetA']);
  });

  it('uses the file id for obj2s images uploaded before files were linked', async () => {
    getSampleFileUrls.mockResolvedValue([
      { url: 'url1', fileId: 'cellSetA', obj2sSampleId: null },
    ]);

    const files = await getSpatialFileUrls('experimentId', ['obj2sSample'], 'ome_zarr_zip', true);

    expect(files[0].sampleId).toEqual('cellSetA');
  });

  it('skips samples without an optional file type', async () => {
    getSampleFileUrls
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValueOnce([{ url: 'url', fileId: 'file' }]);

    const files = await getSpatialFileUrls('experimentId', ['sampleA', 'sampleB'], 'molecules_by_gene', false, { optional: true });

    expect(files.map(({ sampleId }) => sampleId)).toEqual(['sampleB']);
  });

  it('fails if a sample is missing a required file type', async () => {
    getSampleFileUrls.mockRejectedValue(new Error('not found'));

    await expect(
      getSpatialFileUrls('experimentId', ['sampleA'], 'ome_zarr_zip', false),
    ).rejects.toThrow('not found');
  });
});

describe('alignFileUrls', () => {
  it('orders urls as the sample ids, null for samples without a file', () => {
    const files = [
      { url: 'urlB', sampleId: 'B' },
      { url: 'urlA', sampleId: 'A' },
    ];

    expect(alignFileUrls(files, ['A', 'C', 'B'])).toEqual(['urlA', null, 'urlB']);
  });
});

describe('getSpatialTechnology', () => {
  it('uses the technology detected for obj2s spatial objects', () => {
    const sample = { type: 'seurat_spatial_object', options: { spatialTechnology: 'xenium' } };
    expect(getSpatialTechnology(sample)).toEqual('xenium');
  });

  it('uses the sample technology otherwise', () => {
    expect(getSpatialTechnology({ type: 'visium_hd', options: {} })).toEqual('visium_hd');
    expect(getSpatialTechnology(undefined)).toBeUndefined();
  });
});
