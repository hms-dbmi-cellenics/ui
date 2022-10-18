import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import downloadFromUrl from 'utils/downloadFromUrl';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';
import pushNotificationMessage from 'utils/pushNotificationMessage';
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
    // If the error is that the returning expression matrix is empty just let
    // the user know, don't show error state
    if (e.message.includes('R_WORKER_EMPTY_CELL_SET')) {
      dispatch({
        type: PLOT_DATA_LOADED,
        payload: {
          plotUuid,
          plotData: null,
        },
      });

      pushNotificationMessage('warning', endUserMessages.ERROR_NO_MATCHING_CELLS_NORMALIZED_EXPRESSION_MATRIX);

      return;
    }

    const errorMessage = handleError(
      e,
      endUserMessages.ERROR_FETCHING_NORMALIZED_EXPRESSION_MATRIX,
    );

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
