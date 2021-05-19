import experimentsReducer from '../../../redux/reducers/experiments';
import initialState, { experimentTemplate } from '../../../redux/reducers/experiments/initialState';

import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATED,
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
    [experimentId1]: experiment1,
  };

  it('Reduces identical state on unknown action', () => expect(
    experimentsReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Inserts a new experiment correctly', () => {
    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_CREATED,
      payload: {
        experiment: experiment1,
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toEqual(experiment1);
    expect(newState).toMatchSnapshot();
  });

  it('Updates an experiment correctly', () => {
    const newState = experimentsReducer(oneExperimentState, {
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId: experiment1.id,
        experiment: updatedExperiment,
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toEqual(updatedExperiment);
    expect(newState).toMatchSnapshot();
  });

  it('Returns state if experiment does not exist when updating', () => {
    const invalidExperimentState = {
      ...oneExperimentState,
    };

    delete invalidExperimentState[experimentId1];

    const newState = experimentsReducer(invalidExperimentState, {
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId: experiment1.id,
        experiment: updatedExperiment,
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toBe(undefined);
    expect(newState).toEqual(invalidExperimentState);
    expect(newState).toMatchSnapshot();
  });
});
