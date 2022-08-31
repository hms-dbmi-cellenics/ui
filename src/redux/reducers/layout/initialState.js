const initialState = {
  windows: {
    direction: 'row',
    first: {
      first: {
        first: 'UMAP', second: 'Cell sets and Metadata', direction: 'row', splitPercentage: 60,
      },
      second: 'Heatmap',
      direction: 'column',
      splitPercentage: 50,
    },
    second: 'Genes',
    splitPercentage: 70,
  },
  panel: 'Gene list',
};

export default initialState;
