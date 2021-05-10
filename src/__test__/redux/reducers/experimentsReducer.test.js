import experimentsReducer from '../../../redux/reducers/experiments';
import initialState, { experimentTemplate } from '../../../redux/reducers/experiments/initialState';

import {
  EXPERIMENTS_CREATE,
  EXPERIMENTS_UPDATE,
} from '../../../redux/actionTypes/experiments';

describe('experimentsReducer', () => {
  const experimentId1 = 'project-1';

  const experiment1 = {
    ...experimentTemplate,
    name: 'test project',
    id: experimentId1,
    description: 'this is a test description',
    createdDate: '01-01-2021',
    lastViewed: '01-01-2021',
  };

  const updatedExperiment = {
    ...experiment1,
    name: 'updated name',
    lastModified: '02-01-2021',
  };

  const oneExperimentState = {
    ...initialState,
    ids: [experimentId1],
  };

  it('Reduces identical state on unknown action', () => expect(
    experimentsReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Inserts a new experiment correctly', () => {
    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_CREATE,
      payload: {
        experiment: experiment1,
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toEqual(experiment1);
    expect(newState).toMatchSnapshot();
  });

  it('Updates a project correctly', () => {
    const newState = experimentsReducer(oneExperimentState, {
      type: EXPERIMENTS_UPDATE,
      payload: {
        experimentId: experiment1.id,
        experiment: updatedExperiment,
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toEqual(updatedExperiment);
    expect(newState).toMatchSnapshot();
  });
});
