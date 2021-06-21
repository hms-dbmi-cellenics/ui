import { EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES } from '../../actionTypes/experimentSettings';

const copyFilterSettingsToAllSamples = ((step, sampleId) => (dispatch, getState) => {
  const { samples: allSamples } = getState();
  const allSampleIds = Object.keys(allSamples);

  dispatch({
    type: EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES,
    payload: { step, sampleId, allSampleIds },
  });
});

export default copyFilterSettingsToAllSamples;
