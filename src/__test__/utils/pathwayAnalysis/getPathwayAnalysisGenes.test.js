import getDiffExprGenes from 'utils/differentialExpression/getDiffExprGenes';
import { makeStore } from 'redux/store';

import setGeneOrdering from 'redux/actions/differentialExpression/setGeneOrdering';

import { fetchWork } from 'utils/work/fetchWork';

jest.mock('utils/work/fetchWork');

describe('getDiffExpr test', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchWork.mockImplementation(() => Promise.resolve({
      rows: {
        gene_names: ['gene1', 'gene2', 'gene3'],
        gene_ids: ['ENMUSG00000001', 'ENMUSG00000002', 'ENMUSG00000003'],
      },
    }));
  });

  it('Dispatch correctly', async () => {
    const store = makeStore();
    await store.dispatch(getDiffExprGenes(true, 0));

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const body = args[1];

    // Checking body
    expect(body).toEqual(
      expect.objectContaining({
        name: 'DifferentialExpression',
        genesOnly: true,
      }),
    );
  });

  it('Pass on the correct number of genes', async () => {
    const store = makeStore();

    const numGenes = 10;

    await store.dispatch(getDiffExprGenes(false, numGenes));

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const { pagination } = args[3].extras;

    expect(pagination).toEqual(
      expect.objectContaining({
        limit: numGenes,
      }),
    );
  });

  it('Should pass the gene ordering correctly', async () => {
    const store = makeStore();

    const orderBy = 'gene_names';
    const orderDirection = 'ASC';

    // First load the ordering
    await store.dispatch(setGeneOrdering(orderBy, orderDirection));

    // Then dispatch the action
    await store.dispatch(getDiffExprGenes(true, 0));

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const { pagination } = args[3].extras;

    expect(pagination).toEqual(
      expect.objectContaining({
        orderBy,
        orderDirection,
      }),
    );
  });

  it('Should throw error if the workResult returns an error', async () => {
    fetchWork.mockImplementation(() => Promise.reject(new Error('Error')));

    const store = makeStore();

    expect(async () => {
      await store.dispatch(getDiffExprGenes(true, 0));
    }).rejects.toThrow();
  });
});
