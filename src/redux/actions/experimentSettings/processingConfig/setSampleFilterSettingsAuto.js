import { EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO } from '../../../actionTypes/experimentSettings';

const setSampleFilterSettingsAuto = (step, sampleId, isAuto) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO,
    payload: { step, sampleId, isAuto },
  });
};

export default setSampleFilterSettingsAuto;
