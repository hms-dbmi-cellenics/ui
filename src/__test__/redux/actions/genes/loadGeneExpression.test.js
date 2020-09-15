import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import loadGeneExpression from '../../../../redux/actions/genes/loadGeneExpression';
import initialState from '../../../../redux/reducers/genes/initialState';
import sendWork from '../../../../utils/sendWork';

import {
  GENES_EXPRESSION_LOADING,
  GENES_EXPRESSION_LOADED, GENES_EXPRESSION_ERROR,
} from '../../../../redux/actionTypes/genes';

jest.mock('localforage');
jest.mock('../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('loadGeneExpression action', () => {
  const experimentId = '1234';
  const loadingGenes = ['a', 'b', 'c'];

  it('Does not dispatch when expression is already loading', async () => {
    const store = mockStore({
      genes:
        { ...initialState, expression: { ...initialState.expression, loading: ['d'] } },
    });

    store.dispatch(loadGeneExpression(experimentId, loadingGenes));
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
    });

    sendWork.mockImplementation(() => {
      // No need to mock the result accurately.

      const resolveWith = {
        results:
          [
            {},
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    await store.dispatch(loadGeneExpression(experimentId, loadingGenes));

    const firstCall = sendWork.mock.calls[0];
    expect(firstCall[2].genes).toEqual(['b', 'c']);
    expect(sendWork).toMatchSnapshot();
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
    });

    sendWork.mockImplementation(() => {
      // No need to mock the result accurately.

      const resolveWith = {
        results:
          [
            {},
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    await store.dispatch(loadGeneExpression(experimentId, loadingGenes, true));

    const firstCall = sendWork.mock.calls[1];
    expect(firstCall[2].genes).toEqual(['a', 'b', 'c']);
    expect(sendWork).toMatchSnapshot();
  });

  it('Dispatches appropriately on success', async () => {
    const store = mockStore({
      genes: {
        ...initialState,
      },
    });

    sendWork.mockImplementation(() => {
      // No need to mock the result accurately.

      const resolveWith = {
        results:
          [
            {
              body: JSON.stringify({ a: 'b' }),
            },
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    await store.dispatch(loadGeneExpression(experimentId, loadingGenes, true));

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_EXPRESSION_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(GENES_EXPRESSION_LOADED);
    expect(loadedAction.payload.data).toEqual({ a: 'b' });
    expect(loadedAction).toMatchSnapshot();
  });

  it('Dispatches appropriately on failure', async () => {
    const store = mockStore({
      genes: {
        ...initialState,
      },
    });

    sendWork.mockImplementation(() => new Promise((resolve, reject) => reject(new Error('random error!'))));
    await store.dispatch(loadGeneExpression(experimentId, loadingGenes, true));

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(GENES_EXPRESSION_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(GENES_EXPRESSION_ERROR);
    expect(loadedAction).toMatchSnapshot();
  });
});
