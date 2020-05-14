import { v4 as uuidv4 } from 'uuid';
import { LOAD_CELL_SETS, LOAD_CELLS } from './actionType';
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
  );
};

const convertData = (results) => {
  const data = {};

  results.forEach((result, i) => {
    data[i] = {
      mappings: {
        PCA: result,
      },
    };
  });

  return data;
};

// eslint-disable-next-line func-names
const loadCells = (experimentId) => function (dispatch, getState) {
  if (getState().cells.data) {
    return Promise.resolve();
  }
  connectionPromise().then((io) => {
    const requestUuid = uuidv4();

    const request = {
      uuid: requestUuid,
      socketId: io.id,
      experimentId,
      timeout: '2021-01-01T00:00:00Z',
      body: {
        name: 'GetEmbedding',
        type: 'pca',
      },
    };

    io.emit('WorkRequest', request);

    console.log('emitted!!!');

    io.on(`WorkResponse-${requestUuid}`, (res) => {
      let embedding = JSON.parse(res.results[0].body);
      embedding = convertData(embedding);
      console.log('response! ', embedding);
      return dispatch({
        type: LOAD_CELLS,
        data: embedding,
      });
    });
  });
};

// eslint-disable-next-line import/prefer-default-export
export { loadCellSets, loadCells };
