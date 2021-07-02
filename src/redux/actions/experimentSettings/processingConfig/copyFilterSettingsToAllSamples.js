import { EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES } from '../../../actionTypes/experimentSettings';

const copyFilterSettingsToAllSamples = ((step, newSettings, sampleIds) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES,
    payload: { step, newSettings, sampleIds },
  });
});

export default copyFilterSettingsToAllSamples;
