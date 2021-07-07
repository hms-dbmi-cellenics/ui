import { EXPERIMENT_SETTINGS_UPDATE_SAMPLE_FROM_QC, EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE } from '../../../actionTypes/experimentSettings';

const settingsWithSampleId = ['classifier', 'cellSizeDistribution', 'doubletScores', 'mitochondrialContent', 'numGenesVsNumUmis'];
const settingsWithoutSampleId = ['dataIntegration', 'configureEmbedding', 'meta', 'defaultFilterSettings'];

/**
 * Updates filter settings for a step in data processing
 *
 * @param {*} step The key of the step that is changing.
 * @param {*} diff The change itself that is taking place.
 * @param {*} sampleId The id of the sample that had its settings changed
 * (if the settings of the step are sample specific).
 */

const updateProcessingSettingsFromQC = (step, newSettings, sampleId = null) => (dispatch) => {
  if (settingsWithSampleId.includes(step)) {
    if (!sampleId) {
      throw new Error(`sampleId is undefined, but step: ${step} received needs a sampleId`);
    }

    dispatch({
      type: EXPERIMENT_SETTINGS_UPDATE_SAMPLE_FROM_QC,
      payload: {
        step, sampleId, newSettings,
      },
    });
  } else if (settingsWithoutSampleId.includes(step)) {
    dispatch({
      type: EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
      payload: { step, configChange: newSettings, isALocalChange: false },
    });
  } else {
    throw new Error(`Invalid step parameter received: ${step}`);
  }
};

export default updateProcessingSettingsFromQC;
