import addWindow from 'redux/actions/layout/addWindow';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import initialState from 'redux/reducers/layout/initialState';

const mockStore = configureStore([thunk]);

describe('add window', () => {
  const state = { layout: initialState };
  let store;
  beforeEach(() => {
    store = mockStore(state);
  });

  it('adds a window to existing ones', () => {
    const newState = store.dispatch(addWindow('newPanel', 'newWindow'));
    expect(newState).toMatchSnapshot();
  });

  it('adds a new window if layout is empty', () => {
    const newState = store.dispatch(addWindow('newPanel'));
    expect(newState).toMatchSnapshot();
  });

  it('updates panel if window exists', () => {
    const newState = store.dispatch(addWindow('Differential expression', 'Genes'));
    expect(newState).toMatchSnapshot();
  });
});
