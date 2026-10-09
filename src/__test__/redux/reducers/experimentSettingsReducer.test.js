import { enableMapSet } from 'immer';
import experimentSettingsReducer from 'redux/reducers/experimentSettings';
import initialState from 'redux/reducers/experimentSettings/initialState';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';

import {
  EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED,
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
  EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO,
} from 'redux/actionTypes/experimentSettings';

import errorTypes from 'redux/actions/experimentSettings/errorTypes';

enableMapSet();

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
      'sample-KO': {
        auto: true,
        enabled: true,
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

  it('Changing filter enabled property updates sample filter enabled property as well', () => {
    const newState = experimentSettingsReducer(initialExperimentState,
      {
        type: EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
        payload:
        {
          step: 'cellSizeDistribution',
          enabled: false,
        },
      });

    const expectedCellSizeDistribution = {
      'sample-KO': {
        auto: true,
        enabled: false,
        filterSettings: {
          minCellSize: 10800,
          binStep: 200,
        },
      },
    };

    // New entry is created for sample-KO with the new enabled changed to equal that in payload
    expect(newState.processing.cellSizeDistribution).toEqual(expectedCellSizeDistribution);

    // Nothing else changes
    expect(newState).toMatchSnapshot();
  });

  it('Correctly updates pipelineVersion', () => {
    const newState = experimentSettingsReducer(initialExperimentState, {
      type: EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED,
      payload: {
        pipelineVersion: 2,
      },
    });

    expect(newState.info.pipelineVersion).toEqual(2);
    expect(newState).toMatchSnapshot();
  });

  describe('switching a sample filter to automatic', () => {
    const sampleId = 'sample-1';
    const defaultFilterSettings = {
      method: 'localOutlier',
      methodSettings: {
        localOutlier: { cutoff: 3, binStep: 0.2 },
        absoluteThreshold: { min: 120, max: null, binStep: 0.05 },
      },
    };
    const stateWith = (filterSettings) => ({
      ...initialState,
      processing: {
        ...initialState.processing,
        spatialUmiOutlier: {
          [sampleId]: { auto: false, filterSettings, defaultFilterSettings },
        },
      },
    });
    const setAuto = (state) => experimentSettingsReducer(state, {
      type: EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO,
      payload: { step: 'spatialUmiOutlier', sampleId, isAuto: true },
    });

    it('keeps the chosen method and takes its default settings', () => {
      const newState = setAuto(stateWith({
        method: 'absoluteThreshold',
        methodSettings: {
          localOutlier: { cutoff: 1, binStep: 0.2 },
          absoluteThreshold: { min: 5, max: 10, binStep: 0.05 },
        },
      }));

      const { auto, filterSettings } = newState.processing.spatialUmiOutlier[sampleId];
      expect(auto).toBe(true);
      expect(filterSettings).toEqual({ ...defaultFilterSettings, method: 'absoluteThreshold' });
    });

    it('restores the defaults as-is for filters without methods', () => {
      const state = stateWith({ minCellSize: 5 });
      state.processing.spatialUmiOutlier[sampleId].defaultFilterSettings = { minCellSize: 1080 };

      const newState = setAuto(state);

      expect(newState.processing.spatialUmiOutlier[sampleId].filterSettings)
        .toEqual({ minCellSize: 1080 });
    });
  });
});
