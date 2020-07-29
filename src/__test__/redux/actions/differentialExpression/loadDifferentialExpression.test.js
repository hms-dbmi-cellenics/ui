import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import loadDifferentialExpression from '../../../../redux/actions/differentialExpression/loadDifferentialExpression';
import initialState from '../../../../redux/reducers/differentialExpressionReducer/initialState';
import sendWork from '../../../../utils/sendWork';

import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from '../../../../redux/actionTypes/differentialExpression';

jest.mock('localforage');
jest.mock('../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('loadDifferentialExpression action', () => {
  const experimentId = '1234';
  const cellSets = {
    first: 'louvain-0',
    second: 'louvain-1',
  };

  it('Dispatches appropriately on failure', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
    });
    sendWork.mockImplementation(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    await store.dispatch(loadDifferentialExpression(experimentId, 'Versus rest', cellSets));
    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(DIFF_EXPR_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(DIFF_EXPR_ERROR);
    expect(loadedAction).toMatchSnapshot();
  });

  it('Dispatches appropriately on success', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
    });

    sendWork.mockImplementation(() => {
      const resolveWith = {
        results:
          [
            {
              body: JSON.stringify({
                rows: [
                  {
                    pval: 1.16, qval: 2.16, log2fc: 3.45, gene_names: 'A',
                  },
                  {
                    pval: 2.16, qval: 3.16, log2fc: 4.45, gene_names: 'B',
                  },
                  {
                    pval: 3.16, qval: 4.16, log2fc: 5.45, gene_names: 'C',
                  },
                  {
                    pval: 4.16, qval: 5.16, log2fc: 6.45, gene_names: 'D',
                  },
                  {
                    pval: 5.16, qval: 6.16, log2fc: 7.45, gene_names: 'E',
                  },
                  {
                    pval: 6.16, qval: 7.16, log2fc: 8.45, gene_names: 'F',
                  },
                ],
              }),
            },
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    await store.dispatch(loadDifferentialExpression(experimentId, 'Versus rest', cellSets));

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(DIFF_EXPR_LOADING);
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(DIFF_EXPR_LOADED);
    expect(loadedAction).toMatchSnapshot();
  });
});
