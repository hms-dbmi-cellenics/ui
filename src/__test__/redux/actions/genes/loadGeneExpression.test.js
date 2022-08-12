import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fetchWork } from 'utils/work/fetchWork';
import pipelineStatusValues from 'utils/pipelineStatusValues';
import loadGeneExpression from 'redux/actions/genes/loadGeneExpression';
import initialState from 'redux/reducers/genes/initialState';

import {
  GENES_EXPRESSION_LOADING,
  GENES_EXPRESSION_LOADED, GENES_EXPRESSION_ERROR,
} from 'redux/actionTypes/genes';

import '__test__/test-utils/setupTests';

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

  it('Does not dispatch when expression is already loading', async () => {
    const store = mockStore({
      genes:
        { ...initialState, expression: { ...initialState.expression, loading: ['d'] } },
    });

    store.dispatch(loadGeneExpression(experimentId, loadingGenes, componentUuid));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not send work for already loaded expression data.', async () => {
    const store = mockStore({
      genes: {
        ...initialState,
        expression: {
          ...initialState.expression,
          data: {
            ...initialState.expression.data,
            a: {
              min: 0,
              max: 0,
              expression: [0, 0, 0, 0, 0],
            },
          },
        },
      },
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => (
      // No need to mock the result accurately.
      new Promise((resolve) => resolve({}))));

    await store.dispatch(loadGeneExpression(experimentId, loadingGenes, componentUuid));

    const firstCall = fetchWork.mock.calls[0];

    expect(firstCall[1].genes).toEqual(['b', 'c']);
    expect(fetchWork).toMatchSnapshot();
  });

  it('Sends work for already loaded expression data if forced to do so.', async () => {
    const store = mockStore({
      genes: {
        ...initialState,
        expression: {
          ...initialState.expression,
          data: {
            ...initialState.expression.data,
            a: {
              min: 0,
              max: 0,
              expression: [0, 0, 0, 0, 0],
            },
          },
        },
      },
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => (
      // No need to mock the result accurately.
      new Promise((resolve) => resolve({}))));

    await store.dispatch(
      loadGeneExpression(experimentId, loadingGenes, componentUuid, true),
    );

    const firstCall = fetchWork.mock.calls[1];
    expect(firstCall[1].genes).toEqual(['a', 'b', 'c']);
    expect(fetchWork).toMatchSnapshot();
  });

  it('Dispatches appropriately on success', async () => {
    const store = mockStore({
      genes: {
        ...initialState,
      },
      backendStatus,
    });

    const mockResult = {
      geneA: {
        expression: [1],
        mean: 1,
        stdev: 1,
        zScore: [0],
      },
    };

    fetchWork.mockImplementationOnce(() => new Promise((resolve) => resolve(mockResult)));

    await store.dispatch(
      loadGeneExpression(experimentId, loadingGenes, componentUuid, true),
    );

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_EXPRESSION_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(GENES_EXPRESSION_LOADED);
    expect(loadedAction.payload.data).toEqual(mockResult);
    expect(loadedAction).toMatchSnapshot();
  });

  it('Dispatches appropriately on failure', async () => {
    const store = mockStore({
      genes: {
        ...initialState,
      },
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => new Promise((resolve, reject) => reject(new Error('random error!'))));
    await store.dispatch(
      loadGeneExpression(experimentId, loadingGenes, componentUuid, true),
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
        ...initialState,
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
    await store.dispatch(loadGeneExpression(experimentId, loadingGenes, componentUuid, true));

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_EXPRESSION_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const errorAction = store.getActions()[1];
    expect(errorAction.type).toEqual(GENES_EXPRESSION_ERROR);
    expect(errorAction).toMatchSnapshot();
  });
});
