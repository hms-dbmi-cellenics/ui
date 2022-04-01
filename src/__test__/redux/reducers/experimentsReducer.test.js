import { SAMPLES_CREATE } from 'redux/actionTypes/samples';
import experimentsReducer from 'redux/reducers/experiments';
import initialState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import { sampleTemplate } from 'redux/reducers/samples/initialState';

import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_DELETED,
} from '../../../redux/actionTypes/experiments';

describe('experimentsReducer', () => {
  const experimentId1 = 'experiment-1';
  const projectUuid1 = 'project-1';

  const experimentId2 = 'experiment-2';
  const projectUuid2 = 'project-2';

  const rawExperiment1 = {
    experimentId: experimentId1,
    experimentName: 'experiment 1',
    projectId: projectUuid1,
    description: 'this is a test description',
    createdDate: '01-01-2021',
    lastViewed: '01-01-2021',
    meta: {
      organism: null,
      type: '10x',
    },
    sampleIds: [],
    notifyByEmail: true,
  };

  const rawExperiment2 = {
    experimentId: experimentId2,
    experimentName: 'experiment 2',
    projectId: projectUuid2,
    description: 'this is a test description',
    createdDate: '01-01-2021',
    lastViewed: '01-01-2021',
    meta: {
      organism: null,
      type: '10x',
    },
    sampleIds: [],
    notifyByEmail: true,
  };

  const experiment1 = {
    ...experimentTemplate,
    projectUuid: projectUuid1,
    name: 'experiment 1',
    id: experimentId1,
    description: 'this is a test description',
    createdDate: '01-01-2021',
    lastViewed: '01-01-2021',
    sampleIds: [],
    meta: experimentTemplate.meta,
  };

  const experiment2 = {
    ...experimentTemplate,
    projectUuid: projectUuid2,
    name: 'experiment 2',
    id: experimentId2,
    description: 'this is a test description',
    createdDate: '01-01-2021',
    lastViewed: '01-01-2021',
    sampleIds: [],
    meta: experimentTemplate.meta,
  };

  const sampleId = 'testSampleId';
  const experiment1WithSample = {
    ...experiment1,
    sampleIds: [sampleId],
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

  const twoExperimentsState = {
    ...initialState,
    ids: [experimentId1, experimentId2],
    [experimentId1]: experiment1,
    [experimentId2]: experiment2,
  };

  const oneExperimentWithSampleState = {
    ...initialState,
    ids: [experimentId1],
    [experimentId1]: experiment1WithSample,
  };

  const sample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: sampleId,
    createdDate: '2021-01-01T14:48:00.000Z',
    lastModified: '2021-01-01T14:48:00.000Z',
  };

  it('Reduces identical state on unknown action', () => expect(
    experimentsReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Loads an experiment correctly', () => {
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

  it('Loads experiment correctly on existing state', () => {
    const newState = experimentsReducer(oneExperimentState, {
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: [rawExperiment2],
      },
    });

    expect(newState.ids).toEqual([experiment1.id, experiment2.id]);
    expect(newState[experiment2.id]).toEqual(experiment2);
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

  it('Deletes an experiment correctly', () => {
    const newState = experimentsReducer(twoExperimentsState, {
      type: EXPERIMENTS_DELETED,
      payload: {
        experimentIds: experiment2.id,
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState).toEqual(oneExperimentState);
    expect(newState).toMatchSnapshot();
  });

  it('Adds new sampleId when sample is created', () => {
    const newState = experimentsReducer(oneExperimentState, {
      type: SAMPLES_CREATE,
      payload: {
        experimentId: experiment1.id,
        sample,
      },
    });

    expect(newState[experiment1.id].sampleIds).toEqual([sample.uuid]);
    expect(newState).toMatchSnapshot();
  });

  it('Adds new sampleId when sample is created and we already have one sample', () => {
    const anotherSample = {
      ...sampleTemplate,
      name: 'another test sample',
      uuid: 'testAnotherSampleId',
      createdDate: '2021-01-01T14:48:00.000Z',
      lastModified: '2021-01-01T14:48:00.000Z',
    };

    const newState = experimentsReducer(oneExperimentWithSampleState, {
      type: SAMPLES_CREATE,
      payload: {
        experimentId: experiment1.id,
        sample: anotherSample,
      },
    });

    expect(newState[experiment1.id].sampleIds).toEqual([sampleId, anotherSample.uuid]);
    expect(newState).toMatchSnapshot();
  });
});
