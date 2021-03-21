import experimentSettingsReducer from '../../../redux/reducers/experimentSettings';
import initialState from '../../../redux/reducers/experimentSettings/initialState';
import {
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from '../../../redux/actionTypes/experimentSettings';

import errorTypes from '../../../redux/actions/experimentSettings/errorTypes';

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
      type: EXPERIMENT_SETTINGS_PROCESSING_LOAD,
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
});
