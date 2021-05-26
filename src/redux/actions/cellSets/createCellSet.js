import { v4 as uuidv4 } from 'uuid';
import messages from '../../../components/notification/messages';
import { CELL_SETS_CREATE } from '../../actionTypes/cellSets';
import saveCellSets from './saveCellSets';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

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
  };

  if (data.cellIds.size === 0) {
    pushNotificationMessage('info', messages.emptyClusterNotCreated, 5);
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
  pushNotificationMessage('info', messages.newClusterCreated, 5);
};

export default createCellSet;
