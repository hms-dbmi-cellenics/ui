// import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import { fetchWork } from 'utils/work/fetchWork';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const downloadNormalizedMatrix = (
  experimentId,
  filterBy,
) => async (dispatch, getState) => {
  console.log('holaholahola');
  // try {
  const body = {
    name: 'GetNormalizedExpression',
    filterBy,
  };

  console.log('filterByDebug');
  console.log(filterBy);

  // const data = await fetchWork(
  //   experimentId, body, getState,
  // );
  // } catch (e) {
  //   const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_PLOT_DATA);

  //   // dispatch({
  //   //   type: PLOT_DATA_ERROR,
  //   //   payload: {
  //   //     plotUuid,
  //   //     error: errorMessage,
  //   //   },
  //   // });
  // }
};

export default downloadNormalizedMatrix;
