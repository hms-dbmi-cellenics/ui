import _ from 'lodash';

const mean = (array) => _.sum(array) / array.length;

const stdev = (array) => {
  const inputMean = mean(array);
  return Math.sqrt(_.sum(array.map((x) => (x - inputMean) ** 2)) / array.length);
};

export {
  mean,
  stdev,
};
