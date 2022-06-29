import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import { EXPERIMENTS_ERROR, EXPERIMENTS_LOADED, EXPERIMENTS_LOADING } from 'redux/actionTypes/experiments';

const loadExperiments = () => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_LOADING,
  });

  try {
    const data = await fetchAPI('/v2/experiments');

    dispatch({
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: data,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_LOADING_PROJECT);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};
export default loadExperiments;
