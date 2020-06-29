import getApiEndpoint from '../../../utils/apiEndpoint';
import { CELL_SETS_SAVE } from '../../actionTypes/cellSets';
import pushNotificationMessage from '../notifications/pushNotificationMessage';
import composeTree from '../../../utils/composeTree';

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

  await fetch(
    `${getApiEndpoint()}/v1/experiments/${experimentId}/cellSets`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        treeData,
        (k, v) => ((k === 'title') ? undefined : v),
      ),
    },
  ).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: CELL_SETS_SAVE,
      payload: {
        experimentId,
        saved: json,
      },
    }),
  ).catch(() => {
    dispatch(pushNotificationMessage('error', 'Could not connect to the server. Check your internet connection.', 5));
  });
};

export default saveCellSets;
