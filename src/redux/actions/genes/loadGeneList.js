import loadPaginatedGeneProperties from './loadPaginatedGeneProperties';

const loadGeneList = (experimentId) => async (dispatch, getState) => {
  const geneListUuid = 'geneList';

  if (getState().genes.properties.views[geneListUuid]) return;

  const tableState = {
    pagination: {
      current: 1, pageSize: 1000000,
    },
    geneNamesFilter: null,
    sorter: { field: 'gene_names', columnKey: 'gene_names', order: 'ascend' },
  };

  dispatch(loadPaginatedGeneProperties(experimentId, ['dispersions'], geneListUuid, tableState));
};

export default loadGeneList;
