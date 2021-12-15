import _ from 'lodash';

const isSubset = (
  (subsetArray, containingArray) => _.difference(subsetArray, containingArray).length === 0);

// eslint-disable-next-line import/prefer-default-export
export { isSubset };
