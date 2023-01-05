import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

jest.mock('redux/selectors/getNumberOfCellsInGrouping', () => ({
  __esModule: true, // this property makes it work
  default: () => 20,
}));

jest.mock('redux/selectors', () => ({
  getCellSetsHierarchyByKeys: () => () => 1,
}));

describe('getTimeoutForWorkerTask', () => {
  const stateMock = {};

  it('works correctly for GetEmbedding with umap', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'GetEmbedding', { type: 'umap' });
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for GetEmbedding with tsne', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'GetEmbedding', { type: 'tsne' });
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for ClusterCells', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'ClusterCells');
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for MarkerHeatmap', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'MarkerHeatmap');
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for DifferentialExpression', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'DifferentialExpression');
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for ListGenes', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'ListGenes');
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for GeneExpression', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'GeneExpression');
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for GetMitochondrialContent', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'GetMitochondrialContent');
    expect(timeout).toMatchSnapshot();
  });

  it('works correctly for GetDoubletScore', () => {
    const timeout = getTimeoutForWorkerTask(stateMock, 'GetDoubletScore');
    expect(timeout).toMatchSnapshot();
  });

  it('throws for invalid taskName', () => {
    expect(() => getTimeoutForWorkerTask(stateMock, 'InvalidTaskName')).toThrowError('Task doesn\'t exist');
  });
});
