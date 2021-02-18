import experimentSettingsReducer from '../../../redux/reducers/experimentSettings';
import initialState from '../../../redux/reducers/experimentSettings/initialState';
import {
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE, EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
} from '../../../redux/actionTypes/experimentSettings';

describe('experimentSettingsReducer', () => {
  it('Reduces identical state on unknown action', () => expect(
    experimentSettingsReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Updates existing value properly', () => {
    const newState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
        payload:
        {
          settingName: 'configureEmbedding',
          configChange: { embeddingSettings: { method: 'newMethod' } },
        },
      });

    expect(newState.processing.configureEmbedding.embeddingSettings.method).toEqual('newMethod');
    expect(newState).toMatchSnapshot();
  });

  it('Adds new value properly', () => {
    const newState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
        payload:
        {
          settingName: 'configureEmbedding',
          configChange: { embeddingSettings: { newProperty: 'property' } },
        },
      });

    expect(newState.processing.configureEmbedding.embeddingSettings.newProperty).toEqual('property');
    expect(newState).toMatchSnapshot();
  });

  it('Adds new object properly', () => {
    const newState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
        payload:
        {
          settingName: 'configureEmbedding',
          configChange: { embeddingSettings: { newProperty: { name: 'a', value: 'b' } } },
        },
      });

    expect(newState.processing.configureEmbedding.embeddingSettings.newProperty).toEqual({ name: 'a', value: 'b' });
    expect(newState).toMatchSnapshot();
  });

  it('Adds non-existent setting to the set when step is complete.', () => {
    const newState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
        payload:
        {
          settingName: 'configureEmbedding',
          numSteps: 5,
        },
      });

    expect(newState.processing.processingConfig.stepsDone).toEqual(new Set(['configureEmbedding']));
    expect(newState.processing.processingConfig.complete).toEqual(false);
  });

  it("Previously complete step doesn't change status of completion.", () => {
    const oldState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
        payload:
        {
          settingName: 'configureEmbedding',
          numSteps: 5,
        },
      });

    const newState = experimentSettingsReducer(oldState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
        payload:
        {
          settingName: 'configureEmbedding',
          numSteps: 5,
        },
      });

    expect(newState.processing.processingConfig.stepsDone).toEqual(new Set(['configureEmbedding']));
    expect(newState.processing.processingConfig.complete).toEqual(false);
  });

  it('Steps are set to complete when set size equals number of steps to do.', () => {
    const oldState = experimentSettingsReducer(initialState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
        payload:
        {
          settingName: 'configureEmbedding',
          numSteps: 2,
        },
      });

    const newState = experimentSettingsReducer(oldState,
      {
        type: EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
        payload:
        {
          settingName: 'dataIntegration',
          numSteps: 2,
        },
      });

    expect(newState.processing.processingConfig.stepsDone).toEqual(new Set(['configureEmbedding', 'dataIntegration']));
    expect(newState.processing.processingConfig.complete).toEqual(true);
  });
});
