import getApiEndpoint from '../../../utils/apiEndpoint';
import { CELL_SETS_SAVE } from '../../actionTypes/cellSets';
import pushNotificationMessage from '../notifications/pushNotificationMessage';
import composeTree from '../../../utils/composeTree';
import { cacheFetch } from '../../../utils/cacheRequest';

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
  try {
    const json = await cacheFetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/cellSets`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          treeData,
          (k, v) => ((k === 'title') ? undefined : v),
        ),
      },
    );
    dispatch({
      type: CELL_SETS_SAVE,
      payload: {
        experimentId,
        saved: json,
      },
    });
  } catch (e) {
    dispatch(pushNotificationMessage('error', 'Could not connect to the server. Check your internet connection.', 5));
  }
};

export default saveCellSets;
