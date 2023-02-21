import { EXPERIMENT_SETTINGS_INFO_UPDATE } from 'redux/actionTypes/experimentSettings';
import fetchAPI from 'utils/http/fetchAPI';

const toApiV1 = (experimentV2) => {
  const {
    id, name, samplesOrder, pipelines, ...restOfExperiment
  } = experimentV2;

  const pipelinesV1 = {
    gem2s: pipelines.gem2s,
    pipeline: pipelines.qc,
  };

  const experimentV1 = {
    ...restOfExperiment,
    experimentId: id,
    experimentName: name,
    projectId: id,
    sampleIds: samplesOrder,
    meta: pipelinesV1,
    // These are always created with the same value right now
    // when the UI is updated:
    //  - Organism is not going to be used anymore.
    //  - Type will be defined in the samples, not in the experiment.
    organism: null,
    type: '10x',
  };

  return experimentV1;
};

const reloadExperimentInfo = () => async (dispatch, getState) => {
  const { experimentId } = getState().experimentSettings.info;

  const experimentInfoV2 = await fetchAPI(`/v2/experiments/${experimentId}`);

  dispatch({
    type: EXPERIMENT_SETTINGS_INFO_UPDATE,
    payload: toApiV1(experimentInfoV2),
  });
};

export default reloadExperimentInfo;
