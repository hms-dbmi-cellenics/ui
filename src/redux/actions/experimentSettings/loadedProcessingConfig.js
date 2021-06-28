import {
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
} from '../../actionTypes/experimentSettings';

const loadedProcessingConfig = (processingConfig) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
    payload: {
      data: processingConfig,
    },
  });
};

export default loadedProcessingConfig;
