import _ from 'lodash';

/**
 * When this merge runs into objects, it replaces the original array with the new one,
 * We can't use the original _.merge because it merges arrays by adding the different values
 * in their respective positions
 */
const mergeObjectReplacingArrays = (source, diff) => {
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

export default mergeObjectReplacingArrays;
