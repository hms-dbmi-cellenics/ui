import { EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES } from '../../../actionTypes/experimentSettings';

const copyFilterSettingsToAllSamples = ((step, sourceSampleId, sampleIds) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES,
    payload: { step, sourceSampleId, sampleIds },
  });
});

export default copyFilterSettingsToAllSamples;
