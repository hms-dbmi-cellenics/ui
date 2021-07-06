import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
} from '../../actionTypes/experimentSettings';
import loadBackendStatus from '../experimentSettings/backendStatus/loadBackendStatus';

import { loadEmbedding } from '../embedding';

const runOnlyConfigureEmbedding = (experimentId, embeddingMethod, dispatch) => {
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
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
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
    const response = await fetchAPI(
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
    );
    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_STARTING_PIPLELINE);
    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_START,
      payload: {},
    });
    dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not start the pipeline.',
        errorType: message,
      },
    });
  }
};

export default runPipeline;
