import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import downloadFromUrl from 'utils/downloadFromUrl';
import handleError from 'utils/http/handleError';
import fetchWork from 'utils/work/fetchWork';
import writeToFileURL from 'utils/writeToFileURL';

const downloadNormalizedMatrix = (
  plotUuid,
  experimentId,
  subsetBy,
) => async (dispatch, getState) => {
  try {
    const body = {
      name: 'GetNormalizedExpression',
      subsetBy,
    };

    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const data = await fetchWork(
      experimentId,
      body,
      getState,
      dispatch,
    );

    downloadFromUrl(writeToFileURL(data), 'NormalizedExpression.csv');

    dispatch({
      type: PLOT_DATA_LOADED,
      payload: {
        plotUuid,
        plotData: null,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, null, false);

    dispatch({
      type: PLOT_DATA_ERROR,
      payload: {
        plotUuid,
        error: errorMessage,
      },
    });
  }
};

export default downloadNormalizedMatrix;
