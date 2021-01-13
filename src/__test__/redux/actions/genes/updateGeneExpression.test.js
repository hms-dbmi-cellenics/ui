import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import updateGeneExpressionType from '../../../../redux/actions/genes/updateGeneExpressionType';
import initialState, { initialViewState } from '../../../../redux/reducers/genes/initialState';

import {
  GENES_EXPRESSION_LOADING,
  GENES_EXPRESSION_TYPE_UPDATE,
} from '../../../../redux/actionTypes/genes';

jest.mock('localforage');

const mockStore = configureStore([thunk]);

describe('updateGeneExpressionType action', () => {
  const experimentId = '1234';
  const expressionType = 'zScore';

  it('Dispatches the correct action', async () => {
    const store = mockStore({
      genes: { ...initialState },
    });

    store.dispatch(updateGeneExpressionType(experimentId, expressionType));

    const updateAction = store.getActions()[0];
    expect(updateAction.type).toEqual(GENES_EXPRESSION_TYPE_UPDATE);
    expect(updateAction.payload).toEqual({ expressionType });
    expect(updateAction).toMatchSnapshot();
  });

  it('Updates all panels using gene expression data', async () => {
    const store = mockStore({
      genes: {
        ...initialState,
        expression: {
          ...initialState.expression,
          views: {
            view1: {
              ...initialViewState,
              data: ['a'],
            },
            view2: {
              ...initialViewState,
              data: ['s', 'd'],
            },
          },
        },
      },
    });

    store.dispatch(updateGeneExpressionType(experimentId, expressionType));

    expect(store.getActions()[0].type).toEqual(GENES_EXPRESSION_LOADING);
    expect(store.getActions()[1].type).toEqual(GENES_EXPRESSION_LOADING);
  });
});
