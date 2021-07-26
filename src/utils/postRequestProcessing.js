// Calculate ZScore
const calculateZScore = (responseData) => {
  Object.keys(responseData).forEach((gene) => {
    const { mean, stdev } = responseData[gene].rawExpression;

    /* eslint-disable no-param-reassign */
    responseData[gene].zScore = [];
    responseData[gene].rawExpression.expression.forEach((x) => {
      if (x === null) {
        return responseData[gene].zScore.push(null);
      }

      responseData[gene].zScore.push((x - mean) / stdev);
    });
  });

  return responseData;
};

// eslint-disable-next-line import/prefer-default-export
export { calculateZScore };
