/* eslint-disable no-param-reassign */
import { v4 as uuidv4 } from 'uuid';
import {
  LOAD_CELL_SETS, UPDATE_CELL_SETS, CREATE_CLUSTER, LOAD_CELLS, CELL_SETS_COLOR,
  UPDATE_GENE_LIST, LOAD_GENE_LIST,
} from './actionType';
import connectionPromise from '../../utils/socketConnection';

const loadCellSets = (experimentId) => (dispatch, getState) => {
  if (getState().cellSets.data) {
    return null;
  }

  return fetch(`${process.env.REACT_APP_API_URL}/v1/experiments/${experimentId}/cellSets`).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: LOAD_CELL_SETS,
      data: json.cellSets,
    }),
  ).catch((e) => console.log('Error when trying to get cell sets data: ', e));
};

const updateCellSets = (newState) => (dispatch, getState) => {
  if (getState().cellSets.data === newState) {
    return Promise.resolve();
  }

  return dispatch({
    type: UPDATE_CELL_SETS,
    data: newState,
  });
};

const createCluster = (cellSetInfo, clusterName, color) => (dispatch) => {
  const clusterKey = uuidv4();
  const newCluster = {
    key: clusterKey,
    name: clusterName,
    color,
    cellIds: Array.from(cellSetInfo),
  };

  return dispatch({
    type: CREATE_CLUSTER,
    data: newCluster,
  });
};

const cellSetsColor = (colorData) => (dispatch, getState) => {
  if (getState().cells.data) {
    return dispatch({
      type: CELL_SETS_COLOR,
      data: colorData,
    });
  }
  return null;
};

const loadCells = (experimentId, embeddingType) => (dispatch, getState) => {
  if (getState().cells.data) {
    return null;
  }
  return connectionPromise().then((io) => {
    const requestUuid = uuidv4();

    const body = {
      name: 'GetEmbedding',
      type: embeddingType,
    };

    const request = {
      uuid: requestUuid,
      socketId: io.id,
      experimentId,
      timeout: '2021-01-01T00:00:00Z',
      body,
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

const updateGeneList = (experimentId, tableState) => (dispatch, getState) => {
  if (getState().geneList?.tableState === tableState) {
    return null;
  }
  dispatch({
    type: LOAD_GENE_LIST,
  });

  return connectionPromise().then((io) => {
    const requestUuid = uuidv4();
    const { geneList } = getState();

    const orderBy = tableState?.sorter.field
      || geneList.tableState?.sorter.field
      || 'dispersions';

    const orderDirection = tableState?.sorter.order
      || geneList.tableState?.sorter.order
      || 'ascend';

    const currentPage = tableState?.pagination.current
      || geneList.tableState?.pagination.current
      || 1;

    const currentPageSize = tableState?.pagination.pageSize
      || geneList.tableState?.pagination.pageSize
      || 1;

    const body = {
      name: 'ListGenes',
      selectFields: ['gene_names', 'dispersions'],
      orderBy,
      orderDirection: (orderDirection === 'ascend') ? 'ASC' : 'DESC',
      offset: ((currentPage - 1) * currentPageSize),
      limit: currentPageSize,
    };

    const request = {
      uuid: requestUuid,
      socketId: io.id,
      experimentId,
      timeout: '2021-01-01T00:00:00Z',
      body,
    };

    io.emit('WorkRequest', request);

    io.on(`WorkResponse-${requestUuid}`, (res) => {
      const data = JSON.parse(res.results[0].body);

      const { total, rows } = data;

      rows.map((row) => {
        row.key = row.gene_names;
        return row;
      });

      if (tableState && tableState.pagination) {
        tableState.pagination.total = total;
      }

      return dispatch({
        type: UPDATE_GENE_LIST,
        data: {
          rows,
          tableState: tableState || geneList.tableState,
        },
      });
    });
  });
};

export {
  loadCellSets, updateCellSets, createCluster, loadCells, cellSetsColor, updateGeneList,
};
