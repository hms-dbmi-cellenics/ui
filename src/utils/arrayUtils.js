/* MIT License

Copyright(c) Sindre Sorhus < sindresorhus@gmail.com>
(https://sindresorhus.com)
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files(the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and / or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

import _ from 'lodash';

const getArray = (object) => Object.keys(object).reduce((r, k) => {
  object[k].forEach((a, i) => {
    // eslint-disable-next-line no-param-reassign
    r[i] = r[i] || {};
    // eslint-disable-next-line no-param-reassign
    r[i][k] = a;
  });
  return r;
}, []);

const isSubset = (
  (subsetArray, containingArray) => _.difference(subsetArray, containingArray).length === 0);

// Like reverse but it doesn't mutate underlying array
const reversed = (array) => [...array].reverse();

const removed = (item, array) => array.filter((currExpId) => currExpId !== item);

const arrayMoveMutable = (array, fromIndex, toIndex) => {
  const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

  if (startIndex >= 0 && startIndex < array.length) {
    const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

    const [item] = array.splice(fromIndex, 1);
    array.splice(endIndex, 0, item);
  }
};

const arrayMoveImmutable = (array, fromIndex, toIndex) => {
  // eslint-disable-next-line no-param-reassign
  array = [...array];
  arrayMoveMutable(array, fromIndex, toIndex);
  return array;
};

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

export {
  getArray, isSubset, reversed, removed,
  arrayMoveMutable, arrayMoveImmutable, mergeObjectReplacingArrays,
};
