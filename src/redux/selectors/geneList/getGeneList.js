const getGeneList = () => (state) => {
  const geneListUuid = 'geneList';

  const list = state.views[geneListUuid];

  return {
    fetching: list?.fetching,
    error: list?.error,
    geneData: state.data,
  };
};

export default getGeneList;
