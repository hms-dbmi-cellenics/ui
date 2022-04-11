import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
} from 'redux/actionTypes/experimentSettings';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_ERROR,
} from 'redux/actionTypes/backendStatus';

import { saveProcessingSettings } from '../experimentSettings';
import { loadBackendStatus } from '../backendStatus';
import { loadEmbedding } from '../embedding';

const runOnlyConfigureEmbedding = async (experimentId, embeddingMethod, dispatch) => {
  await dispatch(saveProcessingSettings(experimentId, 'configureEmbedding'));

  dispatch({
    type: EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
    payload: {},
  });

  // Only configure embedding was changed so we run loadEmbedding
  dispatch(
    loadEmbedding(
      experimentId,
      embeddingMethod,
      true,
    ),
  );
};

const runPipeline = (experimentId) => async (dispatch, getState) => {
  const { processing } = getState().experimentSettings;
  const { changedQCFilters } = processing.meta;

  if (changedQCFilters.size === 1 && changedQCFilters.has('configureEmbedding')) {
    runOnlyConfigureEmbedding(
      experimentId,
      processing.configureEmbedding.embeddingSettings.method,
      dispatch,
    );

    return;
  }

  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  const changesToProcessingConfig = Array.from(changedQCFilters).map((key) => {
    const currentConfig = processing[key];
    return {
      name: key,
      body: currentConfig,
    };
  });

  const url = `/v1/experiments/${experimentId}/pipelines`;
  try {
    // We are only sending the configuration that we know changed
    // with respect to the one that is already persisted in dynamodb
    // The api will then merge this with the full config saved in dynamodb to get an updated version

    // We don't need to manually save any processing config because it is done by
    // the api once the pipeline finishes successfully
    fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processingConfig: changesToProcessingConfig,
        }),
      },
      false,
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_START,
      payload: {},
    });

    dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    let errorMessage = handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);

    console.log(`error run gem2s ${e}`);
    // temporarily give the user more info if the error is permission denied
    if (errorMessage.includes('does not have access to experiment')) {
      errorMessage += ' Refresh the page to continue with your analysis.';
    }
    // TODO refactor this better once everything is working
    dispatch({
      type: BACKEND_STATUS_ERROR,
      payload: {
        experimentId,
        error: `Could not start QC pipeline. ${errorMessage}`,
      },
    });
  }
};

export default runPipeline;
