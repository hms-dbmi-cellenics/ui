import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import initialState from '../../../../redux/reducers/cellInfo/initialState';
import setCellInfoFocus from '../../../../redux/actions/cellInfo/setCellInfoFocus';
import { CELL_INFO_FOCUS, CELL_INFO_UNFOCUS } from '../../../../redux/actionTypes/cellInfo';

const mockStore = configureStore([thunk]);

const experimentId = '1234';

describe('setCellInfoFocus action', () => {
  it('Dispatches focus event when focus is specified and no previous focus exists', async () => {
    const FOCUS_STORE = 'focus-store';
    const FOCUS_KEY = 'focus-key';

    const store = mockStore({ cellInfo: initialState });
    store.dispatch(setCellInfoFocus(experimentId, FOCUS_STORE, FOCUS_KEY));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(CELL_INFO_FOCUS);
    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches focus event when a previous focus exists but a new one is specified', async () => {
    const FOCUS_STORE = 'focus-store';
    const FOCUS_KEY = 'focus-key';

    const store = mockStore({
      cellInfo: {
        ...initialState,
        focus: {
          ...initialState.focus,
          key: 'old-focus-key',
          store: 'old-focus-store',
        },
      },
    });

    store.dispatch(setCellInfoFocus(experimentId, FOCUS_STORE, FOCUS_KEY));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(CELL_INFO_FOCUS);
    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches unfocus event when a focused data is specified again', async () => {
    const FOCUS_STORE = 'focus-store';
    const FOCUS_KEY = 'focus-key';

    const store = mockStore({
      cellInfo: {
        ...initialState,
        focus: {
          ...initialState.focus,
          key: FOCUS_KEY,
          store: FOCUS_STORE,
        },
      },
    });

    store.dispatch(setCellInfoFocus(experimentId, FOCUS_STORE, FOCUS_KEY));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(CELL_INFO_UNFOCUS);
    expect(firstAction).toMatchSnapshot();
  });
});
