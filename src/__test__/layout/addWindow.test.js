import addWindow from 'redux/actions/layout/addWindow';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const mockStore = configureStore([thunk]);

describe('add window', () => {
  it('adds a window to existing ones', () => {
    const state = {
      layout: {
        windows: {
          first: {
            first: 'samplewindow',
            second: 'secondFirstwindow',
            splitPercentage: 100,
            direction: 'row',
          },
          second: 'secondWindow',
          splitPercentage: 60,
          direction: 'row',
        },
      },
    };
    const store = mockStore(state);
    const newState = store.dispatch(addWindow('newPanel', 'newWindow'));
    expect(newState).toMatchSnapshot();
  });

  it('adds a new window if layout is empty', () => {
    const state = {
      layout: {},
    };
    const store = mockStore(state);
    const newState = store.dispatch(addWindow('newPanel', 'newWindow'));
    expect(newState).toMatchSnapshot();
  });
});
