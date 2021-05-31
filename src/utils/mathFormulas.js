import _ from 'lodash';

const stdev = (array) => {
  const n = array.length;
  const mean = _.sum(array) / n;
  return Math.sqrt(_.sum(array.map((x) => (x - mean) ** 2)) / n);
};

export default stdev;
