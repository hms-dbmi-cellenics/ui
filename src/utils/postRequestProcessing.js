const calculateZScore = (responseData) => {
  const dataWithZScore = Object.entries(responseData).reduce((acc, [gene, value]) => {
    const { mean, stdev, expression } = value.rawExpression;
    const zScore = expression.map((x) => (x !== null ? ((x - mean) / stdev) : null));

    acc[gene] = {
      ...value,
      zScore,
    };

    return acc;
  }, {});

  return dataWithZScore;
};

// eslint-disable-next-line import/prefer-default-export
export { calculateZScore };
