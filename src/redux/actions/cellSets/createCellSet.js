import fetchAPI from 'utils/fetchAPI';
import { isServerError } from 'utils/fetchErrors';
import { v4 as uuidv4 } from 'uuid';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import { CELL_SETS_CREATE } from '../../actionTypes/cellSets';

const createCellSet = (experimentId, name, color, cellIds) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  const data = {
    key: uuidv4(),
    name,
    color,
    cellIds: new Set([...cellIds].map((id) => parseInt(id, 10))),
    type: 'cellSets',
  };

  if (data.cellIds.size === 0) {
    pushNotificationMessage('info', endUserMessages.EMPTY_CLUSTER_NOT_CREATED);
    return;
  }

  dispatch({
    type: CELL_SETS_CREATE,
    payload: {
      experimentId,
      ...data,
    },
  });

  const dataToUpload = {
    key: uuidv4(),
    name,
    color,
    cellIds: [...cellIds].map((id) => parseInt(id, 10)),
    rootNode: false,
    type: 'cellSets',
  };

  const jsonMergerQuery = '$[?(@.key == "scratchpad")]';

  const jsonMergerObject = {
    $match: {
      query: jsonMergerQuery,
      value: {
        children: [
          dataToUpload,
        ],
      },
    },
  };

  const url = `/v1/experiments/${experimentId}/cellSets`;

  try {
    const response = await fetchAPI(
      url,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/boschni-json-merger+json',
        },
        body: JSON.stringify([jsonMergerObject]),
      },
    );

    await response.json();

    pushNotificationMessage('info', endUserMessages.NEW_CLUSTER_CREATED);
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default createCellSet;
