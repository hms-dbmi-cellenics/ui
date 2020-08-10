import { v4 as uuidv4 } from 'uuid';
import messages from '../../../components/notification/messages';
import { CELL_SETS_CREATE } from '../../actionTypes/cellSets';
import saveCellSets from './saveCellSets';
import pushNotificationMessage from '../pushNotificationMessage';

const createCellSet = (experimentId, name, color, cellIds) => (dispatch, getState) => {
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
    cellIds: Array.from(cellIds),
  };

  dispatch({
    type: CELL_SETS_CREATE,
    payload: {
      experimentId,
      ...data,
    },
  });

  dispatch(saveCellSets(experimentId));
  dispatch(pushNotificationMessage('info', messages.newClusterCreated, 5));
};

export default createCellSet;
