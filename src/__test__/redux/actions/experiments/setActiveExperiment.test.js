import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import setActiveExperiment from 'redux/actions/experiments/setActiveExperiment';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import { EXPERIMENTS_SET_ACTIVE } from 'redux/actionTypes/experiments';

const mockStore = configureStore([thunk]);

describe('setActiveExperiment action', () => {
  const activeExperiment = {
    ...experimentTemplate,
    name: 'experiment 1',
    id: '12345',
    createdAt: '01-01-2021',
    updatedAt: '01-01-2021',
  };

  const otherExperiment = {
    ...experimentTemplate,
    name: 'experiment 2',
    id: '67890',
    createdAt: '01-01-2021',
    updatedAt: '01-01-2021',
  };

  const mockState = {
    experiments: {
      ...initialExperimentState,
      ids: [...initialExperimentState.ids, activeExperiment.id, otherExperiment.uuid],
      meta: {
        ...initialExperimentState.meta,
        activeExperimentId: activeExperiment.id,
      },
      [activeExperiment.id]: activeExperiment,
      [otherExperiment.id]: otherExperiment,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(setActiveExperiment(otherExperiment.id));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(EXPERIMENTS_SET_ACTIVE);
    expect(firstAction).toMatchSnapshot();
  });

  it('Does not dispatch if project is the same', async () => {
    const store = mockStore(mockState);
    await store.dispatch(setActiveExperiment(activeExperiment.id));

    expect(store.getActions().length).toEqual(0);
  });
});
