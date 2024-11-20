const initialLayoutSpatial = {
  windows: {
    direction: 'row',
    first: {
      first: {
        first: 'UMAP', second: 'Spatial', direction: 'row', splitPercentage: 62,
      },
      second: {
        first: 'Heatmap',
        second: 'Cell sets and Metadata',
        direction: 'row',
        splitPercentage: 62,
      },
      direction: 'column',
      splitPercentage: 45,
    },
    second: 'Genes',
    splitPercentage: 70,
  },
  panel: 'Gene list',
};

const initialLayoutSingleCell = {
  windows: {
    direction: 'row',
    first: {
      first: {
        first: 'UMAP', second: 'Cell sets and Metadata', direction: 'row', splitPercentage: 62,
      },
      second: 'Heatmap',
      direction: 'column',
      splitPercentage: 45,
    },
    second: 'Genes',
    splitPercentage: 70,
  },
  panel: 'Gene list',
};

export { initialLayoutSpatial, initialLayoutSingleCell };
