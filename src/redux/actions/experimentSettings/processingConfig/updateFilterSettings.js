import { EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE, EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE } from '../../../actionTypes/experimentSettings';

const settingsWithSampleId = ['classifier', 'cellSizeDistribution', 'doubletScores', 'mitochondrialContent', 'numGenesVsNumUmis'];
const settingsWithoutSampleId = ['dataIntegration', 'configureEmbedding', 'meta', 'defaultFilterSettings'];

const updateFilterSettings = (step, diff, sampleId = null) => (dispatch) => {
  if (settingsWithSampleId.includes(step)) {
    if (!sampleId) {
      throw new Error(`sampleId is undefined, but step: ${step} received needs a sampleId`);
    }

    dispatch({
      type: EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
      payload: { step, sampleId, diff },
    });
  } else if (settingsWithoutSampleId.includes(step)) {
    dispatch({
      type: EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
      payload: { step, configChange: diff },
    });
  }
};

export default updateFilterSettings;
