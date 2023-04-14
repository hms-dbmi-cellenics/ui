import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import setComparisonGroup from 'redux/actions/differentialExpression/setComparisonGroup';

import { DIFF_EXPR_COMPARISON_GROUP_SET } from 'redux/actionTypes/differentialExpression';

import initialState from 'redux/reducers/differentialExpression/initialState';

const mockStore = configureStore([thunk]);

describe('setComparisonGroup action', () => {
  const newData = {
    type: 'within',
    cellSet: 'louvain-0',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Dispatches appropriately', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
    });

    store.dispatch(setComparisonGroup(newData));
    const action = store.getActions()[0];

    expect(action.type).toEqual(DIFF_EXPR_COMPARISON_GROUP_SET);
    expect(action.payload).toEqual(newData);
  });
});
