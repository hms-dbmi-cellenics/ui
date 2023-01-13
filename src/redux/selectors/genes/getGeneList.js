import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

const getGeneList = () => (state) => {
  const geneListUuid = 'geneList';

  const list = state.properties.views[geneListUuid];

  return {
    fetching: list?.fetching,
    error: list?.error,
    data: state.properties.data,
  };
};

export default createMemoizedSelector(getGeneList);
