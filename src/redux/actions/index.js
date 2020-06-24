/* eslint-disable no-param-reassign */
import { v4 as uuidv4 } from 'uuid';
import {
  LOAD_CELL_SETS, UPDATE_CELL_SETS, PUSH_CELL_SETS,
  CREATE_CLUSTER, CELL_SETS_COLOR,
  UPDATE_GENE_LIST, LOAD_GENE_LIST, SELECTED_GENES, UPDATE_GENE_EXPRESSION,
  LOAD_CELLS, BUILD_HEATMAP_SPEC, UPDATE_HEATMAP_SPEC, LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR,
  UPDATE_CELL_INFO, SET_FOCUSED_GENE,
} from './actionType';
import sendWork from '../../utils/sendWork';
import getApiEndpoint from '../../utils/apiEndpoint';
import { createColorScale } from '../../utils/embeddingPlotHelperFunctions/helpers';

const TIMEOUT_SECONDS = 30;

const loadCellSets = (experimentId) => (dispatch, getState) => {
  if (getState().cellSets.data) {
    return null;
  }

  return fetch(`${getApiEndpoint()}/v1/experiments/${experimentId}/cellSets`).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: LOAD_CELL_SETS,
      experimentId,
      data: json.cellSets,
    }),
  ).catch((e) => console.error('Error when trying to get cell sets data: ', e));
};

const refreshCellSets = (experimentId) => (dispatch) => {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  dispatch({
    type: LOAD_CELL_SETS,
    experimentId,
    data: undefined,
  });

  fetch(`${process.env.REACT_APP_API_URL}/v1/experiments/generate`, requestOptions).then(
    () => fetch(`${process.env.REACT_APP_API_URL}/v1/experiments/${experimentId}/cellSets`),
  ).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: LOAD_CELL_SETS,
      experimentId,
      data: json.cellSets,
    }),
  )
    .catch((e) => console.log('Error when trying to get cell sets data: ', e));
};

const updateCellSets = (experimentId, newState) => (dispatch, getState) => {
  if (getState().cellSets.data === newState) {
    return null;
  }

  dispatch({
    type: UPDATE_CELL_SETS,
    experimentId,
    data: newState,
  });

  return dispatch(pushCellSets(experimentId));
};

const pushCellSets = (experimentId) => (dispatch, getState) => {
  // If no loaded data exists for our cell sets and some event would
  // trigger a push, we do not want to overwrite our cell sets with
  // empty data.
  if (!getState()?.cellSets?.data) {
    return null;
  }

  return fetch(
    `${getApiEndpoint()}/v1/experiments/${experimentId}/cellSets`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        getState().cellSets.data,
        (k, v) => ((k === 'title') ? undefined : v),
      ),
    },
  ).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: PUSH_CELL_SETS,
      experimentId,
      data: json,
    }),
  ).catch((e) => console.error('Error when trying to push cell sets to API: ', e));
};

const createCluster = (experimentId, cellSetInfo, clusterName, color) => (dispatch) => {
  const clusterKey = uuidv4();
  const newCluster = {
    key: clusterKey,
    name: clusterName,
    color,
    cellIds: Array.from(cellSetInfo),
  };

  dispatch({
    type: CREATE_CLUSTER,
    experimentId,
    data: newCluster,
  });

  return dispatch(pushCellSets(experimentId));
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

  const body = {
    name: 'GetEmbedding',
    type: embeddingType,
  };

  return sendWork(experimentId, TIMEOUT_SECONDS, body).then((res) => {
    const embedding = JSON.parse(res.results[0].body);
    return dispatch({
      type: LOAD_CELLS,
      data: embedding,
      experimentId,
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

  if (tableState.geneNamesFilter) {
    body.geneNamesFilter = tableState.geneNamesFilter;
  }

  return sendWork(experimentId, TIMEOUT_SECONDS, body).then((res) => {
    const data = JSON.parse(res.results[0].body);

    const { total, rows } = data;

    rows.map((row) => {
      row.key = row.gene_names;
      return row;
    });

    if (tableState && tableState.pagination) {
      tableState.pagination.total = total;
    }

    dispatch({
      type: UPDATE_GENE_LIST,
      data: {
        rows,
        tableState: tableState || geneList.tableState,
      },
    });
  });
};

const loadDiffExpr = (
  experimentId, comparisonType, firstSelectedCluster, secondSelectedCluster,
) => (dispatch) => {
  dispatch({
    type: LOAD_DIFF_EXPR,
  });

  const ComparisonTypes = {
    One: 'Versus Rest',
    Two: 'Across Sets',
  };
  const body = {
    name: 'DifferentialExpression',
    maxNum: 100,
    cellSet: firstSelectedCluster.key,
  };

  if (comparisonType === ComparisonTypes.One) {
    body.compareWith = 'rest';
  } else {
    body.compareWith = secondSelectedCluster.key;
  }

  return sendWork(experimentId, TIMEOUT_SECONDS, body).then((res) => {
    let data = {};

    try {
      data = JSON.parse(res.results[0].body);
    } catch (error) {
      console.error(error);
      data = { rows: [] };
    }

    const { rows } = data;
    const total = rows.length;

    rows.map((row) => {
      row.key = row.gene_names;
      return row;
    });

    return dispatch({
      type: UPDATE_DIFF_EXPR,
      data: {
        allData: rows,
        total,
      },
    });
  });
};

const updateSelectedGenes = (genes, selected) => (dispatch, getState) => {
  const { selectedGenes, geneExpressionData } = getState();
  selectedGenes.geneList = selectedGenes.geneList || {};
  let newGenesAdded = false;
  genes.forEach((gene) => {
    if (selected) {
      if (!selectedGenes.geneList[gene]) {
        // This will present a dict of newly selected genes from gene table
        // { <Gene Name>: <Is the gene experession resolved?> }
        selectedGenes.geneList[gene] = false;
        newGenesAdded = true;
      }
    } else {
      delete selectedGenes.geneList[gene];
      const foundGene = geneExpressionData.data.findIndex((g) => g.geneName === gene);
      geneExpressionData.data.splice(foundGene, 1);
    }
  });
  let showAxes = false;
  const selectedGenesNumb = Object.keys(selectedGenes.geneList).length;
  if (selectedGenesNumb < 30) {
    showAxes = true;
  }
  dispatch({
    type: SELECTED_GENES,
    data: { newGenesAdded },
  });
  dispatch({
    type: UPDATE_HEATMAP_SPEC,
    data: {
      genes: geneExpressionData.data,
      rendering: true,
      showAxes,
    },
  });
  setTimeout(() => {
    // Running this action with a delay to allow rerendering of heatmap
    dispatch({
      type: UPDATE_HEATMAP_SPEC,
      data: { rendering: false },
    });
  }, 50);
};

const loadGeneExpression = (experimentId) => (dispatch, getState) => {
  const { geneExpressionData } = getState();
  if (geneExpressionData?.isLoading) {
    return null;
  }
  const { newGenesAdded, geneList } = getState().selectedGenes;
  const newGeneBatch = [];
  if (newGenesAdded) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(geneList)) {
      if (!value) {
        newGeneBatch.push(key);
        geneList[key] = true;
      }
    }
  }
  dispatch({
    type: SELECTED_GENES,
    data: {
      newGenesAdded: false,
    },
  });
  if (newGeneBatch.length) {
    dispatch({
      type: UPDATE_GENE_EXPRESSION,
      data: {
        isLoading: true,
      },
    });
    const body = {
      name: 'GeneExpression',
      cellSets: 'all',
      genes: newGeneBatch,
    };

    return sendWork(experimentId, TIMEOUT_SECONDS, body).then((res) => {
      const heatMapData = JSON.parse(res.results[0].body);
      const { data } = getState().geneExpressionData;
      if (data) {
        Array.prototype.push.apply(heatMapData.data, data);
      }
      dispatch({
        type: UPDATE_GENE_EXPRESSION,
        data: {
          heatMapData,
          isLoading: false,
        },
      });

      dispatch({
        type: BUILD_HEATMAP_SPEC,
        data: {
          geneExpressionData: heatMapData,
        },
      });
    });
  }
};

const updateCellInfo = (cellData) => (dispatch) => {
  dispatch({
    type: UPDATE_CELL_INFO,
    data: {
      ...cellData,
    },
  });
};

const setFocusedGene = (geneName, experimentId) => (dispatch, getState) => {
  const { selectedGenes } = getState();
  if (selectedGenes?.geneList) {
    let foundGene = selectedGenes.geneList[geneName];
    if (foundGene) {
      const { geneExperessionData } = getState();
      foundGene = geneExperessionData.data.find((obj) => obj.geneName === geneName);
      const cellsColoring = createColorScale(
        geneExperessionData.cells,
        foundGene.expression,
        geneExperessionData.minExpression,
        geneExperessionData.maxExpression,
      );
      return dispatch({
        type: SET_FOCUSED_GENE,
        data: {
          cellsColoring,
          geneName,
          isLoading: false,
        },
      });
    }
  }
  dispatch({
    type: SET_FOCUSED_GENE,
    data: {
      isLoading: true,
    },
  });
  const body = {
    name: 'GeneExpression',
    cellSets: 'all',
    genes: [geneName],
  };

  return sendWork(experimentId, TIMEOUT_SECONDS, body).then((res) => {
    const geneExpressionData = JSON.parse(res.results[0].body);
    const cellsColoring = createColorScale(
      geneExpressionData.cells,
      geneExpressionData.data[0].expression,
      geneExpressionData.minExpression,
      geneExpressionData.maxExpression,
    );
    dispatch({
      type: SET_FOCUSED_GENE,
      data: {
        cellsColoring,
        geneName,
        isLoading: false,
      },
    });
  });
};

export {
  loadCellSets,
  updateCellSets,
  refreshCellSets,
  pushCellSets,
  createCluster,
  loadCells,
  cellSetsColor,
  updateGeneList,
  updateSelectedGenes,
  loadGeneExpression,
  loadDiffExpr,
  updateCellInfo,
  setFocusedGene,
};
