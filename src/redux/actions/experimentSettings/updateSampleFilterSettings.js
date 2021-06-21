import { EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE } from '../../actionTypes/experimentSettings';

const updateSampleFilterSettings = (step, sampleId, diff) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
    payload: { step, sampleId, diff },
  });
};

export default updateSampleFilterSettings;
