import { calculateZScore } from '../../utils/postRequestProcessing';

describe('calculateZScore correctly', () => {
  it('Should not break when there is no data', () => {
    const input = {
      geneA: {
        rawExpression: {
          mean: 1,
          stdev: 1,
          expression: [],
        },
      },
    };

    const output = {
      geneA: {
        rawExpression: {
          mean: 1,
          stdev: 1,
          expression: [],
        },
        zScore: [],
      },
    };

    const result = calculateZScore(input);
    expect(result).toEqual(output);
  });

  it('Should not break when stdev is 0', () => {
    // If stdev is 0, data is a constant - not normally distributed

    const input = {
      geneA: {
        rawExpression: {
          mean: 1,
          stdev: 0,
          expression: [2, 3, 4],
        },
      },
    };

    const output = {
      geneA: {
        rawExpression: {
          mean: 1,
          stdev: 0,
          expression: [2, 3, 4],
        },
        zScore: [Infinity, Infinity, Infinity],
      },
    };

    const result = calculateZScore(input);
    expect(result).toEqual(output);
  });

  it('Calculates zScore properly', () => {
    const input = {
      geneA: {
        rawExpression: {
          mean: 2,
          stdev: 1,
          expression: [1, 2, 3],
        },
      },
    };

    const output = {
      geneA: {
        rawExpression: {
          mean: 2,
          stdev: 1,
          expression: [1, 2, 3],
        },
        zScore: [-1, 0, 1],
      },
    };

    const result = calculateZScore(input);
    expect(result).toEqual(output);
  });
});
