/* eslint-disable global-require */
import { fetchWork, generateETag } from 'utils/work/fetchWork';
import { Environment } from 'utils/deploymentInfo';
import { getFourGenesMatrix } from '../ExpressionMatrix/testMatrixes';

const {
  mockGenesListData,
  mockCacheGet,
  mockCacheSet,
  mockDispatchWorkRequest,
  mockSeekFromS3,
  mockReduxState,
  mockQcPipelineStartDate,
} = require('__test__/utils/work/fetchWork.mock');

jest.mock(
  'utils/cache',
  () => require('__test__/utils/work/fetchWork.mock').mockCacheModule,
);
jest.mock(
  'utils/work/seekWorkResponse',
  () => require('__test__/utils/work/fetchWork.mock').mockSeekWorkResponseModule,
);

const experimentId = '1234';
const NON_GENE_EXPRESSION_ETAG = 'a1d0453fad3f37cb03fc5e400f84775a'; // pragma: allowlist secret
const GENE_EXPRESSION_ABCD_ETAG = '89edca596f4a2ec8139b3e1face47c4a'; // pragma: allowlist secret
const GENE_EXPRESSION_D_ETAG = '78cf13c1fb1596e64f07fa93d6d028a9'; // pragma: allowlist secret
const timeout = 10;
const mockExtras = undefined;

const nonGeneExpressionWorkRequest = {
  name: 'ListGenes',
};

const geneExpressionWorkRequest = {
  name: 'GeneExpression',
  genes: ['A', 'B', 'C', 'D'],
};

describe('fetchWork', () => {
  beforeEach(async () => {
    Storage.prototype.setItem = jest.fn();

    jest.clearAllMocks();

    mockSeekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => mockGenesListData);
  });

  it('runs correctly for gene expression work request', async () => {
    mockSeekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementation(() => (getFourGenesMatrix()));

    const res = await fetchWork(
      experimentId,
      geneExpressionWorkRequest,
      mockReduxState(experimentId),
      { timeout },
    );

    // Temporarily disabled the cache for gene expression
    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      experimentId,
      { name: 'GeneExpression', genes: ['A', 'B', 'C', 'D'] },
      timeout,
      GENE_EXPRESSION_ABCD_ETAG,
      expect.anything(),
    );

    // The expected response should be fine

    // Disabled gene expression cache, so the whole thing is being loaded
    // expect(mockCacheGet).toHaveBeenCalledTimes(4);
    // expect(mockCacheSet).toHaveBeenCalledTimes(1);
    // expect(mockCacheSet).toHaveBeenCalledWith(
    //   mockCacheKeyMappings.D,
    //   expectedResponse.D,
    // );
    expect(res).toMatchSnapshot();
    expect(mockSeekFromS3).toHaveBeenCalledTimes(2);
  });

  it('runs correctly for non gene expression work request', async () => {
    const res = await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockReduxState(experimentId),
      { timeout },
    );

    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      experimentId,
      nonGeneExpressionWorkRequest,
      timeout,
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
    );
    expect(mockCacheGet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledWith(
      NON_GENE_EXPRESSION_ETAG,
      mockGenesListData,
    );
    expect(mockSeekFromS3).toHaveBeenCalledTimes(2);
    expect(res).toEqual(mockGenesListData);
  });

  it('Throws an error if the dispatched work request throws an error', async () => {
    mockDispatchWorkRequest.mockImplementationOnce(() => {
      throw new Error('Worker timeout');
    });

    await expect(
      fetchWork(
        experimentId,
        nonGeneExpressionWorkRequest,
        mockReduxState(experimentId),
        { timeout: 10 },
      ),
    ).rejects.toThrow();

    expect(mockCacheGet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).not.toHaveBeenCalled();

    // Only called once when checking for the work result in S3
    expect(mockSeekFromS3).toHaveBeenCalledTimes(1);
  });

  it('does not change ETag if caching is enabled', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'false' : null));

    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockReduxState(experimentId),
      { timeout },
    );

    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
    );
  });

  it('changes ETag if caching is disabled', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'true' : null));

    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockReduxState(experimentId),
      { timeout },
    );

    expect(mockDispatchWorkRequest).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
    );
  });

  it('Caching is disabled by default if environment is dev', async () => {
    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockReduxState(experimentId, Environment.DEVELOPMENT),
      { timeout },
    );

    expect(mockDispatchWorkRequest).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
    );
  });

  it('Setting cache to false in development enables cache', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'false' : null));

    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockReduxState(experimentId, Environment.DEVELOPMENT),
      { timeout },
    );

    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
    );
  });
});

describe('generateEtag', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    global.Math.random = jest.fn(() => 1);
  });

  it('Generates the correct ETag', async () => {
    const ETag = generateETag(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockExtras,
      mockQcPipelineStartDate,
      Environment.PRODUCTION,
    );

    expect(ETag).toEqual(NON_GENE_EXPRESSION_ETAG);
  });

  it('Generates the correct geneExpression ETag', async () => {
    const ETag = generateETag(
      experimentId,
      { name: 'GeneExpression', genes: ['D'] },
      mockExtras,
      mockQcPipelineStartDate,
      Environment.PRODUCTION,
    );

    expect(ETag).toEqual(GENE_EXPRESSION_D_ETAG);
  });

  it('Generates unique key for dev environment', async () => {
    Storage.prototype.getItem = jest.fn(() => 'true');

    generateETag(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockExtras,
      mockQcPipelineStartDate,
      Environment.DEVELOPMENT,
    );

    expect(global.Math.random).toHaveBeenCalledTimes(1);
  });

  it('Does not generate a unique key for GetEmbedding in dev environment', async () => {
    Storage.prototype.getItem = jest.fn(() => 'true');

    generateETag(
      experimentId,
      { name: 'GetEmbedding' },
      mockExtras,
      mockQcPipelineStartDate,
      Environment.DEVELOPMENT,
    );

    expect(global.Math.random).not.toHaveBeenCalled();
  });
});
