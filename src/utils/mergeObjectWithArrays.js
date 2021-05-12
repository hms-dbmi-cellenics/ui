import _ from 'lodash';

const mergeObjectWithArrays = (source, diff) => {
  const arrayMerge = (originalArray, resultingArray) => {
    if (_.isArray(originalArray) && resultingArray) {
      return resultingArray;
    }
  };

  return _.mergeWith(
    source,
    diff,
    arrayMerge,
  );
};

export default mergeObjectWithArrays;
