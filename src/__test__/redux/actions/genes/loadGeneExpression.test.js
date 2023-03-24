import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { SparseMatrix } from 'mathjs';

import loadGeneExpression from 'redux/actions/genes/loadGeneExpression';
import getInitialState from 'redux/reducers/genes/getInitialState';
import { GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED, GENES_EXPRESSION_ERROR } from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import pipelineStatusValues from 'utils/pipelineStatusValues';

import { getOneGeneMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

jest.mock('utils/work/fetchWork');

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const mockStore = configureStore([thunk]);

describe('loadGeneExpression action', () => {
  const experimentId = '1234';
  const componentUuid = 'asd';
  const loadingGenes = ['a', 'b', 'c'];

  const backendStatus = {
    [experimentId]: {
      status: {
        pipeline: {
          status: 'SUCCEEDED',
          startDate: '2021-01-01T01:01:01.000Z',
        },
      },
    },
  };

  let initialGenesState;

  const loadGene = (matrix) => {
    matrix.pushGeneExpression(
      ['a'],
      new SparseMatrix([0, 0, 0, 0, 0]),
      new SparseMatrix([0, 0, 0, 0, 0]),
      new SparseMatrix([0, 0, 0, 0, 0]),
      {
        a: {
          rawMean: 0, rawStdev: 0, truncatedMin: 0, truncatedMax: 0,
        },
      },
    );
  };

  beforeEach(() => {
    initialGenesState = getInitialState();
  });

  it('Does not dispatch when expression is already loading', async () => {
    const store = mockStore({
      genes:
        { ...initialGenesState, expression: { ...initialGenesState.expression, loading: ['d'] } },
    });

    store.dispatch(loadGeneExpression(experimentId, loadingGenes, componentUuid));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not send work for already loaded expression data.', async () => {
    loadGene(initialGenesState.expression.matrix);
    const store = mockStore({ genes: initialGenesState, backendStatus });

    fetchWork.mockImplementationOnce(() => (
      // No need to mock the result accurately.
      new Promise((resolve) => resolve({}))));

    await store.dispatch(loadGeneExpression(experimentId, loadingGenes, componentUuid));

    const firstCall = fetchWork.mock.calls[0];

    expect(firstCall[1].genes).toEqual(['b', 'c']);
    expect(fetchWork).toMatchSnapshot();
  });

  it('Dispatches appropriately on success', async () => {
    const store = mockStore({
      genes: {
        ...initialGenesState,
      },
      backendStatus,
    });

    const mockResult = getOneGeneMatrix('geneA', 1);

    fetchWork.mockImplementationOnce(() => new Promise((resolve) => resolve(mockResult)));

    await store.dispatch(
      loadGeneExpression(experimentId, loadingGenes, componentUuid),
    );

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(_.isEqual(actions[1].payload.newGenes, mockResult)).toBe(true);
  });

  it('Dispatches appropriately on failure', async () => {
    const store = mockStore({
      genes: {
        ...initialGenesState,
      },
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => new Promise((resolve, reject) => reject(new Error('random error!'))));
    await store.dispatch(
      loadGeneExpression(experimentId, loadingGenes, componentUuid),
    );

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_EXPRESSION_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const errorAction = store.getActions()[1];
    expect(errorAction.type).toEqual(GENES_EXPRESSION_ERROR);
    expect(errorAction).toMatchSnapshot();
  });

  it('Dispatches appropriately on unrun pipeline', async () => {
    const store = mockStore({
      genes: {
        ...initialGenesState,
      },
      backendStatus: {
        [experimentId]: {
          status: {
            pipeline: {
              status: pipelineStatusValues.NOT_CREATED,
              startDate: null,
            },
          },
        },
      },
    });

    fetchWork.mockImplementation(() => new Promise((resolve, reject) => reject(new Error('random error!'))));
    await store.dispatch(loadGeneExpression(experimentId, loadingGenes, componentUuid));

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_EXPRESSION_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const errorAction = store.getActions()[1];
    expect(errorAction.type).toEqual(GENES_EXPRESSION_ERROR);
    expect(errorAction).toMatchSnapshot();
  });
});
