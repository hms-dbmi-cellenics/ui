import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import composeTree from '../../../utils/composeTree';
import { CELL_SETS_SAVE } from '../../actionTypes/cellSets';

const saveCellSets = (experimentId) => async (dispatch, getState) => {
  const {
    loading, hierarchy, properties, error,
  } = getState().cellSets;

  // If no loaded data exists for our cell sets and some event would
  // trigger a push, we do not want to overwrite our cell sets with
  // empty data.
  if (loading || error) {
    return null;
  }

  const treeData = composeTree(hierarchy, properties);
  const url = `/v1/experiments/${experimentId}/cellSets`;
  try {
    console.log('in saveCellSets, calling the API');
    const response = await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          treeData,
          (k, v) => ((k === 'title') ? undefined : v),
        ),
      },
    );

    const json = await response.json();
    console.log('%%%%%%% save ', json);
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    dispatch({
      type: CELL_SETS_SAVE,
      payload: {
        experimentId,
        saved: json,
      },
    });
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default saveCellSets;
