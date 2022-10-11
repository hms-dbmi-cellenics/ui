// import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR }
// from 'redux/actionTypes/componentConfig';

import downloadFromUrl from 'utils/downloadFromUrl';
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

  await fetchWork(
    experimentId,
    body,
    getState,
    {
      cacheable: false,
      customFileName: 'NormalizedExpression.csv.gz',
      customResultHandler: async (response) => {
        downloadFromUrl(response.signedUrl);

        return true;
      },
    },
  );

  // console.log('dataDebug');
  // console.log(data);

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
