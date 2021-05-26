import fetchAPI from '../../../utils/fetchAPI';
import { CELL_SETS_SAVE } from '../../actionTypes/cellSets';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import composeTree from '../../../utils/composeTree';
import messages from '../../../components/notification/messages';

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
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}/cellSets`,
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

    dispatch({
      type: CELL_SETS_SAVE,
      payload: {
        experimentId,
        saved: json,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', messages.saveCellSets, 5);
  }
};

export default saveCellSets;
