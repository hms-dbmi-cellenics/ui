import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';

import { Environment } from 'utils/deploymentInfo';
import generateETag from 'utils/work/generateETag';
import { makeStore } from 'redux/store';
import { mockQcPipelineStartDate } from '__test__/utils/work/fetchWork.mock';

const NON_GENE_EXPRESSION_ETAG = '8203e3ba0d492753400d09168c0f0b03'; // pragma: allowlist secret
const GENE_EXPRESSION_D_ETAG = '8993e43f446701ebe837fdec97429fce'; // pragma: allowlist secret

const experimentId = '1234';
const mockExtras = undefined;

const nonGeneExpressionWorkRequest = {
  name: 'ListGenes',
};

enableFetchMocks();

describe('generateEtag', () => {
  let store;

  beforeEach(() => {
    jest.resetAllMocks();

    global.Math.random = jest.fn(() => 1);

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId)));

    store = makeStore();
  });

  it('Generates the correct ETag', async () => {
    const ETag = await generateETag(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockExtras,
      mockQcPipelineStartDate,
      Environment.PRODUCTION,
      store.dispatch,
      store.getState,
    );

    expect(ETag).toEqual(NON_GENE_EXPRESSION_ETAG);
  });

  it('Generates the correct geneExpression ETag', async () => {
    const ETag = await generateETag(
      experimentId,
      { name: 'GeneExpression', genes: ['D'] },
      mockExtras,
      mockQcPipelineStartDate,
      Environment.PRODUCTION,
      store.dispatch,
      store.getState,
    );

    expect(ETag).toEqual(GENE_EXPRESSION_D_ETAG);
  });

  it('Generates unique key for dev environment', async () => {
    Storage.prototype.getItem = jest.fn(() => 'true');

    await generateETag(
      experimentId,
      nonGeneExpressionWorkRequest,
      mockExtras,
      mockQcPipelineStartDate,
      Environment.DEVELOPMENT,
      store.dispatch,
      store.getState,
    );

    expect(global.Math.random).toHaveBeenCalledTimes(1);
  });

  it('Does not generate a unique key for GetEmbedding in dev environment', async () => {
    Storage.prototype.getItem = jest.fn(() => 'true');

    await generateETag(
      experimentId,
      { name: 'GetEmbedding' },
      mockExtras,
      mockQcPipelineStartDate,
      Environment.DEVELOPMENT,
      store.dispatch,
      store.getState,
    );

    expect(global.Math.random).not.toHaveBeenCalled();
  });
});
