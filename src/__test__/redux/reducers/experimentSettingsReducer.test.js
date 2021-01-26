import experimentSettingsReducer from '../../../redux/reducers/experimentSettings';
import initialState from '../../../redux/reducers/experimentSettings/initialState';
import {
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
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
});
