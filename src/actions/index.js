import { v4 as uuidv4 } from 'uuid';
import { LOAD_CELL_SETS, LOAD_CELLS, CELL_SETS_COLOUR } from './actionType';
import { connectionPromise } from '../components/content-wrapper/ContentWrapper';


// eslint-disable-next-line func-names
const loadCellSets = (experimentId) => function (dispatch, getState) {
  if (getState().cellSets.data) {
    return Promise.resolve();
  }

  fetch(`${process.env.REACT_APP_API_URL}/v1/experiments/${experimentId}/cellSets`).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: LOAD_CELL_SETS,
      data: json.cellSets,
    }),
  ).catch((e) => console.log('Error when trying to get cell sets data: ', e));
};

// eslint-disable-next-line func-names
const loadCells = (experimentId, requestBody) => function (dispatch, getState) {
  if (getState().cells.data) {
    return Promise.resolve();
  }
  return connectionPromise().then((io) => {
    const requestUuid = uuidv4();

    const request = {
      uuid: requestUuid,
      socketId: io.id,
      experimentId,
      timeout: '2021-01-01T00:00:00Z',
      body: requestBody,
    };

    io.emit('WorkRequest', request);

    console.log('emitted!!!');

    io.on(`WorkResponse-${requestUuid}`, (res) => {
      const embedding = JSON.parse(res.results[0].body);
      console.log('response! ');
      return dispatch({
        type: LOAD_CELLS,
        data: embedding,
      });
    });
  });
};

// eslint-disable-next-line func-names
const cellSetsColour = (newState) => function (dispatch, getState) {
  console.log('in the action: ', newState);
  if (getState().cells.data) {
    return dispatch({
      type: CELL_SETS_COLOUR,
      data: newState,
    });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { loadCellSets, loadCells, cellSetsColour };
