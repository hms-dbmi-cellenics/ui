import { createSelector } from 'reselect';
import memoize from 'lru-memoize';

import _ from 'lodash';

const createMemoizedSelector = (
  selector, inputSelectors = [(state) => state], maxCachedKeys = 1,
) => {
  const makerFunction = (...params) => createSelector(
    inputSelectors,
    selector(...params),
  );

  return memoize(maxCachedKeys, _.isEqual)(makerFunction);
};

export default createMemoizedSelector;
