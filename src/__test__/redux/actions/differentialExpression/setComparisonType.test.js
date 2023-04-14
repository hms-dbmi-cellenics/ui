import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import setComparisonType from 'redux/actions/differentialExpression/setComparisonType';

import { DIFF_EXPR_COMPARISON_TYPE_SET } from 'redux/actionTypes/differentialExpression';

import initialState from 'redux/reducers/differentialExpression/initialState';

const mockStore = configureStore([thunk]);

describe('setComparisonType action', () => {
  const newData = {
    type: 'within',
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

    store.dispatch(setComparisonType(newData.type));
    const action = store.getActions()[0];

    expect(action.type).toEqual(DIFF_EXPR_COMPARISON_TYPE_SET);
    expect(action.payload).toEqual(newData);
  });
});
