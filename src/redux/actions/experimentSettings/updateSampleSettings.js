import { EXPERIMENT_SETTINGS_SAMPLE_UPDATE } from '../../actionTypes/experimentSettings';

const updateSampleSettings = (
  settingName, sampleId, diff,
) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_SAMPLE_UPDATE,
    payload: { settingName, sampleId, diff },
  });
};

export default updateSampleSettings;
