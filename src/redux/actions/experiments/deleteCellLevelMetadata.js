import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import {
  EXPERIMENTS_UPDATED,
} from 'redux/actionTypes/experiments';

const deleteCellLevelMetadata = (experimentId) => async (dispatch) => {
  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/cellLevelMeta`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    dispatch({
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId,
        experiment: { cellLevelMetadata: null },
      },
    });
  } catch (e) {
    handleError(e, e.userMessage);
  }
};

export default deleteCellLevelMetadata;
