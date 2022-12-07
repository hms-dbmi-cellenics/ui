import initialState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import experimentsReducer from 'redux/reducers/experiments';
import { sampleTemplate } from 'redux/reducers/samples/initialState';

import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_DELETED,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_METADATA_CREATE,
  EXPERIMENTS_METADATA_RENAME,
  EXPERIMENTS_METADATA_DELETE,
} from 'redux/actionTypes/experiments';

import { SAMPLES_CREATED, SAMPLES_DELETE } from 'redux/actionTypes/samples';
import { EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED } from 'redux/actionTypes/experimentSettings';

describe('experimentsReducer', () => {
  const experimentId1 = 'experiment-1';
  const experimentId2 = 'experiment-2';

  const experiment1 = {
    id: experimentId1,
    name: 'experiment 1',
    description: 'this is a test description',
    sampleIds: [],
    metadataKeys: [],
    notifyByEmail: true,
    createdAt: '2021-01-01',
    updatedAt: '2022-01-17',
    pipelineVersion: 1,
  };

  const experiment2 = {
    id: experimentId2,
    name: 'experiment 2',
    description: 'this is a test description',
    sampleIds: [],
    metadataKeys: [],
    notifyByEmail: true,
    createdAt: '2021-01-01',
    updatedAt: '2022-01-17',
    pipelineVersion: 1,
  };

  const sampleId = 'testSampleId';
  const experiment1WithSample = {
    ...experiment1,
    sampleIds: [sampleId],
  };

  const updatedExperiment = {
    ...experiment1,
    name: 'updated name',
    updatedAt: '02-01-2021',
  };

  const oneExperimentState = {
    ...initialState,
    ids: [experimentId1],
    [experimentId1]: experiment1,
    meta: {
      loading: false,
      saving: false,
      error: false,
    },
  };

  const twoExperimentsState = {
    ...initialState,
    ids: [experimentId1, experimentId2],
    [experimentId1]: experiment1,
    [experimentId2]: experiment2,
    meta: {
      loading: false,
      saving: false,
      error: false,
    },
  };

  const oneExperimentWithSampleState = {
    ...initialState,
    ids: [experimentId1],
    [experimentId1]: experiment1WithSample,
    meta: {
      loading: false,
      saving: false,
      error: false,
    },
  };

  const sample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: sampleId,
    createdAt: '2021-01-01T14:48:00.000Z',
    updatedAt: '2021-01-01T14:48:00.000Z',
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
        experiments: [experiment1],
      },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toEqual(experiment1);
    expect(newState).toMatchSnapshot();
  });

  it('Overwrites existing state on loading experiments', () => {
    const newState = experimentsReducer(oneExperimentState, {
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: [experiment2],
      },
    });

    expect(newState.ids).toEqual([experiment2.id]);
    expect(newState[experiment2.id]).toEqual(experiment2);
    expect(newState).toMatchSnapshot();
  });

  it('Loads experiments correctly', () => {
    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: [
          experiment1, experiment2,
        ],
      },
    });
    expect(newState.ids).toEqual([experiment1.id, experiment2.id]);
    expect(newState.meta.activeExperimentId).toEqual(experiment1.id);
    expect(newState).toMatchSnapshot();
  });

  it('Loads 0 experiments correctly', () => {
    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: [],
      },
    });
    expect(newState.ids).toEqual([]);
    expect(newState.meta.activeExperimentId).toEqual(undefined);
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
    const createdExperimentData = {
      id: experiment1.id,
      name: experiment1.name,
      description: experiment1.description,
      createdAt: experiment1.createdAt,
    };

    const newState = experimentsReducer(initialState, {
      type: EXPERIMENTS_CREATED,
      payload: { experiment: createdExperimentData },
    });

    expect(newState.ids).toEqual([experiment1.id]);
    expect(newState[experiment1.id]).toEqual(
      {
        ...experimentTemplate,
        ...createdExperimentData,
      },
    );
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
      type: SAMPLES_CREATED,
      payload: {
        experimentId: experiment1.id,
        samples: [sample],
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
      createdAt: '2021-01-01T14:48:00.000Z',
      updatedAt: '2021-01-01T14:48:00.000Z',
    };

    const newState = experimentsReducer(oneExperimentWithSampleState, {
      type: SAMPLES_CREATED,
      payload: {
        experimentId: experiment1.id,
        samples: [anotherSample],
      },
    });

    expect(newState[experiment1.id].sampleIds).toEqual([sampleId, anotherSample.uuid]);
    expect(newState).toMatchSnapshot();
  });

  it('Sets up saving state correctly', () => {
    const newState = experimentsReducer({
      ...oneExperimentWithSampleState,
      meta: {
        ...oneExperimentWithSampleState.meta,
        loading: false,
        saving: false,
        error: true,
      },
    }, {
      type: EXPERIMENTS_SAVING,
    });

    expect(newState.meta.error).toBe(false);
    expect(newState.meta.loading).toBe(false);
    expect(newState.meta.saving).toBe(true);
    expect(newState).toMatchSnapshot();
  });

  it('Deletes samples correctly', () => {
    const newState = experimentsReducer(oneExperimentWithSampleState, {
      type: SAMPLES_DELETE,
      payload: {
        experimentId: experiment1.id,
        sampleIds: [sampleId],
      },
    });

    expect(newState[experiment1.id].sampleIds).toHaveLength(0);
    expect(newState).toMatchSnapshot();
  });

  it('Correctly creates experiment metadata', () => {
    const newMetadataKey = 'metadata-test';

    const stateWithMetadata = {
      ...oneExperimentWithSampleState,
      [experiment1.id]: {
        ...oneExperimentWithSampleState[experiment1.id],
        metadataKeys: [],
      },
    };

    const newState = experimentsReducer(stateWithMetadata, {
      type: EXPERIMENTS_METADATA_CREATE,
      payload: {
        key: newMetadataKey,
        experimentId: experiment1.id,
      },
    });

    expect(newState[experiment1.id].metadataKeys).toEqual([newMetadataKey]);
    expect(newState).toMatchSnapshot();
  });

  it('Correctly renames experiment metadata', () => {
    const oldMetadataKey = 'metadata-old';
    const newMetadataKey = 'metadata-new';
    const stateWithMetadata = {
      ...oneExperimentWithSampleState,
      [experiment1.id]: {
        ...oneExperimentWithSampleState[experiment1.id],
        metadataKeys: [oldMetadataKey],
      },
    };

    const newState = experimentsReducer(stateWithMetadata, {
      type: EXPERIMENTS_METADATA_RENAME,
      payload: {
        oldKey: oldMetadataKey,
        newKey: newMetadataKey,
        experimentId: experiment1.id,
      },
    });

    expect(newState[experiment1.id].metadataKeys).toEqual([newMetadataKey]);
    expect(newState).toMatchSnapshot();
  });

  it('Correctly deletes experiment metadata', () => {
    const metadataKey = 'metadata-old';
    const stateWithMetadata = {
      ...oneExperimentWithSampleState,
      [experiment1.id]: {
        ...oneExperimentWithSampleState[experiment1.id],
        metadataKeys: [metadataKey],
      },
    };

    const newState = experimentsReducer(stateWithMetadata, {
      type: EXPERIMENTS_METADATA_DELETE,
      payload: {
        key: metadataKey,
        experimentId: experiment1.id,
      },
    });

    expect(newState[experiment1.id].metadataKeys).toEqual([]);
    expect(newState).toMatchSnapshot();
  });

  it('Correctly updates pipelineVersion', () => {
    const newState = experimentsReducer(oneExperimentWithSampleState, {
      type: EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED,
      payload: {
        experimentId: experiment1.id,
        pipelineVersion: 2,
      },
    });

    expect(newState[experiment1.id].pipelineVersion).toEqual(2);
    expect(newState).toMatchSnapshot();
  });
});
