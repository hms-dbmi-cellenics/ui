import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  EXPERIMENTS_CREATE,
} from '../../../../redux/actionTypes/experiments';
import { createExperiment, saveExperiment } from '../../../../redux/actions/experiments';
import initialExperimentState from '../../../../redux/reducers/experiments/initialState';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

jest.mock('localforage');

jest.mock('../../../../redux/actions/experiments/saveExperiment');
saveExperiment.mockImplementation(() => async () => { });

const mockStore = configureStore([thunk]);

describe('createExperiment', () => {
  const projectUuid = 'project-1';

  const mockState = {
    projects: {
      ...initialProjectState,
      [projectUuid]: {
        ...projectTemplate,
        uuid: projectUuid,
        experiments: [],
      },
    },
    experiments: {
      ...initialExperimentState,
    },
  };

  it('Dispatches action when called', async () => {
    const store = mockStore(mockState);
    await store.dispatch(createExperiment(projectUuid));

    const action = store.getActions();
    expect(action[0].type).toEqual(EXPERIMENTS_CREATE);
  });

  it('Dispatches call to save experiment', async () => {
    const store = mockStore(mockState);
    await store.dispatch(createExperiment(projectUuid));

    expect(saveExperiment).toHaveBeenCalled();
  });
});
