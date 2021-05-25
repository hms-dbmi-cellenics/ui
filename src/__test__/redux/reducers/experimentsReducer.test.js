import experimentsReducer from '../../../redux/reducers/experiments';
import initialState, { experimentTemplate } from '../../../redux/reducers/experiments/initialState';

import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_ERROR,
} from '../../../redux/actionTypes/experiments';

describe('experimentsReducer', () => {
  const experimentId1 = 'experiment-1';
  const projectUuid = 'project-1';

  const rawExperiment1 = {
    experimentId: experimentId1,
    experimentName: 'test project',
    projectId: projectUuid,
    description: 'this is a test description',
    createdDate: '01-01-2021',
    lastViewed: '01-01-2021',
  };

  const experiment1 = {
    ...experimentTemplate,
    projectUuid,
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

  it('Loads an experiment correct', () => {
    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: [rawExperiment1],
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toEqual(experiment1);
    expect(newState).toMatchSnapshot();
  });

  it('Loading state changes meta state', () => {
    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_LOADING,
    });

    expect(newState.meta.loading).toEqual(true);
    expect(newState).toMatchSnapshot();
  });

  it('Error state inserts error correctly', () => {
    const errorMsg = 'Error message';

    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_ERROR,
      payload: { error: errorMsg },
    });

    expect(newState.meta.error).toEqual(errorMsg);
    expect(newState).toMatchSnapshot();
  });

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
