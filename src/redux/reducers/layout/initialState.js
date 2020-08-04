const initialState = {
  windows: {
    direction: 'row',
    first: {
      first: 'UMAP Embedding',
      second: 'Heatmap',
      direction: 'column',
      splitPercentage: 60,
    },
    second: {
      direction: 'column',
      first: 'Cell set',
      second: 'Tools',
      splitPercentage: 40,
    },
    splitPercentage: 70,
  },
  panel: 'Gene list',
};

export default initialState;
