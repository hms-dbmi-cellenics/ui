const workResponse = {
  data: {
    GENE1: {
      rawExpression: {
        expression: [1, 2, 3, 4, 5],
        mean: 3,
        stdev: 1.41421,
      },
      truncatedExpression: {
        expression: [1, 2, 3, 4, 5],
        min: 0,
        max: 5,
      },
      zScore: [0.1, 0.2, 0.3, 0.4, 0.5],
    },
    GENE2: {
      rawExpression: {
        expression: [1, 2, 3, 4, 5],
        mean: 3,
        stdev: 1.41421,
      },
      truncatedExpression: {
        expression: [1, 2, 3, 4, 5],
        min: 0,
        max: 5,
      },
      zScore: [0.1, 0.2, 0.3, 0.4, 0.5],
    },
    GENE3: {
      rawExpression: {
        expression: [1, 2, 3, 4, 5],
        mean: 3,
        stdev: 1.41421,
      },
      truncatedExpression: {
        expression: [1, 2, 3, 4, 5],
        min: 0,
        max: 5,
      },
      zScore: [0.1, 0.2, 0.3, 0.4, 0.5],
    },
  },
  order: ['GENE1', 'GENE2', 'GENE3'],
};

export default workResponse;
