/* eslint-disable no-param-reassign */
import {
  UPDATE_GENE_LIST, LOAD_GENE_LIST, SELECTED_GENES, UPDATE_GENE_EXPRESSION,
  BUILD_HEATMAP_SPEC, UPDATE_HEATMAP_SPEC, LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR,
  UPDATE_CELL_INFO, SET_FOCUSED_GENE,
} from '../actionTypes';
import { fetchCachedWork } from '../../utils/cacheRequest';
import pushNotificationMessage from './notifications/pushNotificationMessage';

const DEFAULT_TIMEOUT_SECONDS = 30;
const DIFF_EXPR_TIMEOUT_SECONDS = 90;


const updateGeneList = (experimentId, tableState) => async (dispatch, getState) => {
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

  try {
    const res = await fetchCachedWork(experimentId, DEFAULT_TIMEOUT_SECONDS, body);

    const data = JSON.parse(res[0].body);
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
  } catch (error) {
    dispatch(pushNotificationMessage('error', 'Failed to update gene list', 5));
  }
};

const loadDiffExpr = (
  experimentId, comparisonType, selectedCellSets,
) => async (dispatch) => {
  dispatch({
    type: LOAD_DIFF_EXPR,
  });

  const ComparisonTypes = {
    One: 'Versus rest',
    Two: 'Across sets',
  };
  const body = {
    name: 'DifferentialExpression',
    maxNum: 100,
    cellSet: selectedCellSets.first,
  };

  if (comparisonType === ComparisonTypes.One) {
    body.compareWith = 'rest';
  } else {
    body.compareWith = selectedCellSets.second;
  }

  try {
    const res = await fetchCachedWork(experimentId, DIFF_EXPR_TIMEOUT_SECONDS, body);
    let data = {};
    try {
      data = JSON.parse(res[0].body);
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
  } catch (error) {
    dispatch(pushNotificationMessage('error', 'Failed to load Differential Expression data', 5));
  }
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

const loadGeneExpression = (experimentId) => async (dispatch, getState) => {
  const { geneExpressionData, cellSets } = getState();
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

    let clusterBy = 'all';
    // if louvain clusters exist, cluster by them
    if (cellSets && cellSets.hierarchy) {
      const louvainClusters = cellSets.hierarchy.filter((clusters) => clusters.key === 'louvain');
      if (louvainClusters.length > 0) {
        clusterBy = louvainClusters[0].children.map((child) => child.key);
      }
    }

    const body = {
      name: 'GeneExpression',
      cellSets: clusterBy,
      genes: newGeneBatch,
    };

    try {
      const res = await fetchCachedWork(experimentId, DEFAULT_TIMEOUT_SECONDS, body);
      const heatMapData = JSON.parse(res[0].body);
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
    } catch (error) {
      dispatch(pushNotificationMessage('error', 'Failed to load Gene Expression data', 5));
    }
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

const setFocusedGene = (geneName, experimentId) => async (dispatch, getState) => {
  const { selectedGenes } = getState();
  if (selectedGenes?.geneList) {
    let foundGeneName = selectedGenes.geneList[geneName];
    if (foundGeneName) {
      const { geneExpressionData } = getState();
      foundGeneName = geneExpressionData.data.find((obj) => obj.geneName === geneName);
      return dispatch({
        type: SET_FOCUSED_GENE,
        data: {
          cells: geneExpressionData.cells,
          expression: foundGeneName.expression,
          geneName,
          minExpression: geneExpressionData.minExpression,
          maxExpression: geneExpressionData.maxExpression,
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

  try {
    const res = await fetchCachedWork(experimentId, DEFAULT_TIMEOUT_SECONDS, body);
    const geneExpressionData = JSON.parse(res[0].body);
    dispatch({
      type: SET_FOCUSED_GENE,
      data: {
        cells: geneExpressionData.cells,
        expression: geneExpressionData.data[0].expression,
        geneName,
        minExpression: geneExpressionData.minExpression,
        maxExpression: geneExpressionData.maxExpression,
        isLoading: false,
      },
    });
  } catch (error) {
    dispatch(pushNotificationMessage('error', 'Failed to load Gene Expression data', 5));
  }
};

export {
  updateGeneList,
  updateSelectedGenes,
  loadGeneExpression,
  loadDiffExpr,
  updateCellInfo,
  setFocusedGene,
};
