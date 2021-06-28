import { v4 as uuidv4 } from 'uuid';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import { CELL_SETS_CREATE } from '../../actionTypes/cellSets';
import saveCellSets from './saveCellSets';

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

  await dispatch(saveCellSets(experimentId));
  pushNotificationMessage('info', endUserMessages.NEW_CLUSTER_CREATED);
};

export default createCellSet;
