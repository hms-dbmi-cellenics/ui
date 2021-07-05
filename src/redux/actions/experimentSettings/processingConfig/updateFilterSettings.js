import { EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE, EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE } from '../../../actionTypes/experimentSettings';

const settingsWithSampleId = ['classifier', 'cellSizeDistribution', 'doubletScores', 'mitochondrialContent', 'numGenesVsNumUmis'];
const settingsWithoutSampleId = ['dataIntegration', 'configureEmbedding', 'meta', 'defaultFilterSettings'];

/**
 * Updates filter settings for a step in data processing
 *
 * @param {*} step The key of the step that is changing.
 * @param {*} diff The change itself that is taking place.
 * @param {*} sampleId The id of the sample that had its settings changed
 * (if the settings of the step are sample specific).
 * @param {*} isALocalChange Whether this is an update received from qc running
 * or a change that this client is performing
 */

const updateFilterSettings = (step, diff, sampleId = null, isALocalChange = true) => (dispatch) => {
  if (settingsWithSampleId.includes(step)) {
    if (!sampleId) {
      throw new Error(`sampleId is undefined, but step: ${step} received needs a sampleId`);
    }

    dispatch({
      type: EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
      payload: {
        step, sampleId, diff, isALocalChange,
      },
    });
  } else if (settingsWithoutSampleId.includes(step)) {
    dispatch({
      type: EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
      payload: { step, configChange: diff, isALocalChange },
    });
  } else {
    throw new Error(`Invalid step parameter received: ${step}`);
  }
};

export default updateFilterSettings;
