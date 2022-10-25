import generateETag from 'utils/work/generateETag';
import { Environment } from 'utils/deploymentInfo';

import { mockQcPipelineStartDate } from '__test__/utils/work/fetchWork.mock';
import processingConfigData from '__test__/data/processing_config.json';

const NON_GENE_EXPRESSION_ETAG = 'f255925e708bf92a4ac6bb5125987bf2'; // pragma: allowlist secret
const GENE_EXPRESSION_D_ETAG = '78cf13c1fb1596e64f07fa93d6d028a9'; // pragma: allowlist secret

const experimentId = '1234';
const mockExtras = undefined;

const nonGeneExpressionWorkRequest = {
  name: 'ListGenes',
};

const { clusteringSettings } = processingConfigData.processingConfig.configureEmbedding;

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
      clusteringSettings,
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
      clusteringSettings,
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
      clusteringSettings,
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
      clusteringSettings,
    );

    expect(global.Math.random).not.toHaveBeenCalled();
  });

  it('Throws if clusteringSetting is not passed', async () => {
    Storage.prototype.getItem = jest.fn(() => 'true');

    expect(() => generateETag(
      experimentId,
      { name: 'GetEmbedding' },
      mockExtras,
      mockQcPipelineStartDate,
      Environment.DEVELOPMENT,
    )).toThrow(new Error('Clustering settings required to launch work request'));
  });
});
