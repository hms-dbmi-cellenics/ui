import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import {
  EXPERIMENTS_LOADED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_LOADING,
} from 'redux/actionTypes/experiments';

const toApiV1 = (experimentV2) => {
  const {
    id,
    name,
    description,
    samplesOrder,
    notifyByEmail,
    processingConfig,
    createdAt,
    pipelines,
  } = experimentV2;

  const experimentV1 = {
    experimentId: id,
    projectId: id,
    description,
    experimentName: name,
    processingConfig,
    createdDate: createdAt,
    notifyByEmail,
    sampleIds: samplesOrder,
    meta: {
      // This is always 10x and organism so we can just generate them here
      organism: null,
      type: '10x',
      gem2s: pipelines.gem2s ?? undefined,
      pipeline: pipelines.qc ?? undefined,
    },
  };

  return experimentV1;
};

const loadExperiments = (
  projectUuid,
) => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_LOADING,
  });

  try {
    let data = await fetchAPI(`/v2/experiments/${projectUuid}`);

    data = [toApiV1(data)];

    dispatch({
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: data,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadExperiments;
