import {
  DIFF_EXPR_LOADING,
} from 'redux/actionTypes/differentialExpression';
import { makeStore } from 'redux/store';
import fetchWork from 'utils/work/fetchWork';

import setGeneOrdering from 'redux/actions/differentialExpression/setGeneOrdering';
import getDiffExprGenes from 'utils/extraActionCreators/differentialExpression/getDiffExprGenes';

import fake from '__test__/test-utils/constants';

jest.mock('utils/work/fetchWork');

const expectedResult = {
  total: 3,
  data: {
    gene_names: ['gene1', 'gene2', 'gene3'],
    gene_id: ['ENMUSG00000001', 'ENMUSG00000002', 'ENMUSG00000003'],
  },
};

let store = null;

describe('getDiffExpr test', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    store = makeStore();
    fetchWork.mockImplementation(() => Promise.resolve(expectedResult));
  });

  it('Dispatch correctly', async () => {
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
    const numGenes = 10;

    await store.dispatch(getDiffExprGenes(false, numGenes));

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const { pagination } = args[4].extras;

    expect(pagination).toEqual(
      expect.objectContaining({
        limit: numGenes,
      }),
    );
  });

  it('Should pass the gene ordering correctly', async () => {
    const orderBy = 'gene_names';
    const orderDirection = 'ASC';

    // First load the ordering
    await store.dispatch(setGeneOrdering(orderBy, orderDirection));

    // Then dispatch the action
    await store.dispatch(getDiffExprGenes(true, 0));

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const { pagination } = args[4].extras;

    expect(pagination).toEqual(
      expect.objectContaining({
        orderBy,
        orderDirection,
      }),
    );
  });

  it('Should pass filters into the request', async () => {
    const advancedFilters = [
      {
        type: 'numeric',
        columnName: 'logFC',
        comparison: 'greaterThan',
        value: 0,
      },
      {
        type: 'numeric',
        columnName: 'p_val_adj',
        comparison: 'greaterThan',
        value: 0.5,
      },
    ];

    // Explicitly set the filters

    store.dispatch({
      type: DIFF_EXPR_LOADING,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        advancedFilters,
      },
    });

    // Then dispatch the action
    await store.dispatch(getDiffExprGenes(true, 0));

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const { pagination } = args[4].extras;

    expect(pagination).toEqual(
      expect.objectContaining({
        filters: advancedFilters,
      }),
    );
  });

  it('Should throw error if the workResult returns an error', async () => {
    fetchWork.mockImplementation(() => Promise.reject(new Error('Error')));

    expect(async () => {
      await store.dispatch(getDiffExprGenes(true, 0));
    }).rejects.toThrow();
  });
});
