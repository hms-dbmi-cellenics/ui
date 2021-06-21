import { EXPERIMENT_SETTINGS_SAMPLE_UPDATE } from '../../actionTypes/experimentSettings';

const updateSampleSettings = (
  step, sampleId, diff,
) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_SAMPLE_UPDATE,
    payload: { step, sampleId, diff },
  });
};

export default updateSampleSettings;
