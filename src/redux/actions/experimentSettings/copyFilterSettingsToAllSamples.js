import { EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES } from '../../actionTypes/experimentSettings';

const copyFilterSettingsToAllSamples = ((step, sampleId) => (dispatch, getState) => {
  const { cellSets } = getState();

  const allSampleIds = cellSets.hierarchy?.find(
    (rootNode) => (rootNode.key === 'sample'),
  )?.children.map(
    (child) => child.key,
  );

  dispatch({
    type: EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES,
    payload: { step, sampleId, allSampleIds },
  });
});

export default copyFilterSettingsToAllSamples;
