import { EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE } from '../../../actionTypes/experimentSettings';

const updateNonSampleFilterSettings = (configName, configChange) => (dispatch) => {
  const validStep = ['dataIntegration', 'configureEmbedding', 'meta'].includes(configName);
  if (!validStep) {
    throw new Error(`Invalid step parameter received: ${configName}`);
  }

  dispatch({
    type: EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
    payload: { step: configName, configChange },
  });
};

export default updateNonSampleFilterSettings;
