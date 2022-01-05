import _ from 'lodash';

const isSubset = (
  (subsetArray, containingArray) => _.difference(subsetArray, containingArray).length === 0);

// Like reverse but it doesn't mutate underlying array
const reversed = (array) => [...array].reverse();

export { isSubset, reversed };
