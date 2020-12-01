import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import initialState from '../../../../redux/reducers/cellInfo/initialState';
import setCellInfoFocus from '../../../../redux/actions/cellInfo/setCellInfoFocus';

const mockStore = configureStore([thunk]);

const experimentId = '1234';

describe('setCellInfoFocus action', () => {
  it('Dispatches focus event when gene is specified', async () => {
    const store = mockStore(initialState);

    store.dispatch(setFocusedGene(experimentId, 'asd'));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(GENES_FOCUS);
    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches unfocus event when no is specified', async () => {
    const store = mockStore({ ...initialState, focused: 'asd' });
    store.dispatch(setFocusedGene(experimentId, undefined));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(GENES_UNFOCUS);
    expect(firstAction).toMatchSnapshot();
  });
});
