import {
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
} from '../../../actionTypes/experimentSettings';

import saveProcessingSettings from './saveProcessingSettings';

const loadedProcessingConfig = (
  experimentId, processingConfig, fromGem2s = false,
) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
    payload: {
      data: processingConfig,
      fromGem2s,
    },
  });

  if (fromGem2s) {
    Object.keys(processingConfig).forEach((step) => {
      dispatch(saveProcessingSettings(experimentId, step));
    });
  }
};

export default loadedProcessingConfig;
