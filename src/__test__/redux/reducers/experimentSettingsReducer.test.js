import _ from 'lodash';

import experimentSettingsReducer from '../../../redux/reducers/experimentSettings';
import initialState from '../../../redux/reducers/experimentSettings/initialState';
import generateExperimentSettingsMock from '../../test-utils/experimentSettings.mock';

import {
  EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
} from '../../../redux/actionTypes/experimentSettings';

import errorTypes from '../../../redux/actions/experimentSettings/errorTypes';

const initialExperimentState = generateExperimentSettingsMock(['sample-KO']);

describe('experimentSettingsReducer', () => {
  it('Reduces identical state on unknown action', () => expect(
    experimentSettingsReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Sets up loading state on loading action', () => {
    const testData = 'test data';
    const newData = {
      test: testData,
    };

    const newState = experimentSettingsReducer({ ...initialState }, {
      payload: { data: newData },
      type: EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
    });

    expect(newState.processing.meta.loading).toEqual(false);
    expect(newState.processing.test).toEqual(testData);
  });

  it('Properly sets error on state', () => {
    const errorMessage = 'ERROR : Failed to load state';
    const newState = experimentSettingsReducer({ ...initialState }, {
      payload: { error: errorMessage, errorType: errorTypes.LOADING_PROCESSING_SETTINGS },
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
    });

    expect(newState.processing.meta.loading).toEqual(false);
    expect(newState.processing.meta.loadingSettingsError).toEqual(errorMessage);
  });

  it('Updates existing value properly', () => {
    const newState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
        payload:
        {
          step: 'configureEmbedding',
          configChange: { embeddingSettings: { method: 'newMethod' } },
        },
      });

    expect(newState.processing.configureEmbedding.embeddingSettings.method).toEqual('newMethod');
    expect(newState).toMatchSnapshot();
  });

  it('Adds new value properly', () => {
    const newState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
        payload:
        {
          step: 'configureEmbedding',
          configChange: { embeddingSettings: { newProperty: 'property' } },
        },
      });

    expect(newState.processing.configureEmbedding.embeddingSettings.newProperty).toEqual('property');
    expect(newState).toMatchSnapshot();
  });

  it('Adds new object properly', () => {
    const newState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
        payload:
        {
          step: 'configureEmbedding',
          configChange: { embeddingSettings: { newProperty: { name: 'a', value: 'b' } } },
        },
      });

    expect(newState.processing.configureEmbedding.embeddingSettings.newProperty).toEqual({ name: 'a', value: 'b' });
    expect(newState).toMatchSnapshot();
  });

  it('Updates sample settings properly', () => {
    const newState = experimentSettingsReducer(initialExperimentState,
      {
        type: EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
        payload:
        {
          step: 'cellSizeDistribution',
          sampleId: 'sample-KO',
          diff: { binStep: 400 },
        },
      });

    const expectedCellSizeDistribution = {
      enabled: true,
      'sample-KO': {
        auto: true,
        filterSettings: {
          minCellSize: 10800,
          binStep: 400,
        },
      },
    };

    // New entry is created for sample-KO with the new binStep while default value isn't changed
    expect(newState.processing.cellSizeDistribution).toEqual(expectedCellSizeDistribution);

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });

  it('updates backend status on error properly', () => {
    const newState = experimentSettingsReducer(initialExperimentState,
      {
        type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
        payload:
        {
          error: 'error',
        },
      });

    expect(newState.backendStatus.error).toEqual('error');

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });

  it('updates backend status on loading properly', () => {
    const newState = experimentSettingsReducer(initialExperimentState,
      { type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING });

    expect(newState.backendStatus.loading).toEqual(true);
    expect(newState.backendStatus.error).toEqual(false);

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });

  it('updates backend status on loaded properly', () => {
    const initialExperimentStateWithPipelineStatus = _.cloneDeep(initialExperimentState);

    initialExperimentStateWithPipelineStatus.backendStatus.status.pipeline = { status: 'NotCreated' };

    const newState = experimentSettingsReducer(initialExperimentStateWithPipelineStatus,
      {
        type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
        payload: {
          status: {
            gem2s: { status: 'Running' },
          },
        },
      });

    // Sets backend load states correctly
    expect(newState.backendStatus.loading).toEqual(false);
    expect(newState.backendStatus.error).toEqual(false);

    // New state of updated service is there
    expect(newState.backendStatus.status.gem2s.status).toEqual('Running');

    // Previous state of another service is still there
    expect(newState.backendStatus.status.pipeline.status).toEqual('NotCreated');

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });
});
