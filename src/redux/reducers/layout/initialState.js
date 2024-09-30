const initialState = {
  windows: {
    direction: 'row',
    first: {
      first: {
        first: 'UMAP', second: 'Spatial', direction: 'row', splitPercentage: 60,
      },
      second: {
        first: 'Heatmap',
        second: 'Cell sets and Metadata',
        direction: 'row',
        splitPercentage: 60,
      },
      direction: 'column',
      splitPercentage: 45,
    },
    second: 'Genes',
    splitPercentage: 70,
  },
  panel: 'Gene list',
};

export default initialState;
