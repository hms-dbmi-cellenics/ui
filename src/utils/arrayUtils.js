import _ from 'lodash';

const isSubset = (
  (subsetArray, containingArray) => _.difference(subsetArray, containingArray).length === 0);

// Like reverse but it doesn't mutate underlying array
const reversed = (array) => [...array].reverse();

const removed = (item, array) => array.filter((currExpId) => currExpId !== item);

export { isSubset, reversed, removed };
