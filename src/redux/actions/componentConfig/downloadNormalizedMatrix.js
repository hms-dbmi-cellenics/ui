// import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR }
// from 'redux/actionTypes/componentConfig';

import { fetchWork } from 'utils/work/fetchWork';
// import handleError from 'utils/http/handleError';
// import endUserMessages from 'utils/endUserMessages';

const downloadNormalizedMatrix = (
  experimentId,
  subsetBy,
) => async (dispatch, getState) => {
  // try {
  const body = {
    name: 'GetNormalizedExpression',
    subsetBy,
  };

  const data = await fetchWork(
    experimentId, body, getState,
  );

  console.log('dataDebug');
  console.log(data);
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
