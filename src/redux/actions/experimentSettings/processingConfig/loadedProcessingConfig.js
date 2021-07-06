import {
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
} from '../../../actionTypes/experimentSettings';

const loadedProcessingConfig = (
  experimentId, processingConfig, fromGem2s = false,
) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
    payload: { data: processingConfig, fromGem2s },
  });
};

export default loadedProcessingConfig;
