import _ from 'lodash';

/**
  This function merges objects replacing old arrays in its properties with
  the new ones unlike _.merge which combines old and new arrays.
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
