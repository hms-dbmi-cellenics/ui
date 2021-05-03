import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from '../../actionTypes/experimentSettings';

const updateExperimentInfo = (experimentData) => async (dispatch) => {
  const { experimentId, experimentName } = experimentData;

  dispatch({
    type: EXPERIMENT_SETTINGS_INFO_UPDATE,
    payload: {
      experimentId,
      experimentName,
    },
  });
};

export default updateExperimentInfo;
