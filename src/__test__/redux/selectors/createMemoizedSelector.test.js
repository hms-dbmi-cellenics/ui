import _ from 'lodash';

import memoize from 'lru-memoize';
import { createSelector } from 'reselect';

import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

jest.mock('lru-memoize');
jest.mock('reselect');

describe('createMemoizedSelector', () => {
  const returnOfSelector = 'returnOfSelector';

  let returnOfMemoize;

  beforeEach(() => {
    jest.clearAllMocks();

    returnOfMemoize = jest.fn(() => { });
    memoize.mockReturnValue(returnOfMemoize);
  });

  it('memoizes correctly with default values if not specified', () => {
    createMemoizedSelector(() => returnOfSelector);

    // Calls with default values
    expect(memoize).toHaveBeenCalledWith(4, _.isEqual);

    expect(returnOfMemoize).toHaveBeenCalledTimes(1);

    // If we call the memoized function
    returnOfMemoize.mock.calls[0][0]();

    // A reselect selector is created with the expected parameters
    expect(createSelector).toHaveBeenCalledWith(expect.anything(), returnOfSelector);
  });

  it('memoizes correctly with custom maxCachedKeys if specified', () => {
    createMemoizedSelector(() => returnOfSelector, { maxCachedKeys: 10 });

    // Maintains default value if not specified (_.isEqual)
    expect(memoize).toHaveBeenCalledWith(10, _.isEqual);

    expect(returnOfMemoize).toHaveBeenCalledTimes(1);

    // If we call the memoized function
    returnOfMemoize.mock.calls[0][0]();

    // A reselect selector is created with the expected parameters (and the custm inputSelectors)
    expect(createSelector).toHaveBeenCalledWith(expect.anything(), returnOfSelector);
  });

  it('memoizes correctly with custom inputSelectors if specified', () => {
    const inputSelectors = [];

    createMemoizedSelector(() => returnOfSelector, { inputSelectors });

    // Maintains default values on memoize
    expect(memoize).toHaveBeenCalledWith(4, _.isEqual);

    expect(returnOfMemoize).toHaveBeenCalledTimes(1);

    // If we call the memoized function
    returnOfMemoize.mock.calls[0][0]();

    // A reselect selector is created with the expected parameters (and the custm inputSelectors)
    expect(createSelector).toHaveBeenCalledWith(inputSelectors, returnOfSelector);
  });

  it('memoizes correctly with custom comparisonOperator if specified', () => {
    const comparisonOperator = () => { };

    createMemoizedSelector(() => returnOfSelector, { comparisonOperator });

    // Maintains default value if not specified (4) but calls with custom comparisonOperator
    expect(memoize).toHaveBeenCalledWith(4, comparisonOperator);

    expect(returnOfMemoize).toHaveBeenCalledTimes(1);

    // If we call the memoized function
    returnOfMemoize.mock.calls[0][0]();

    // A reselect selector is created with the expected parameters (and the custm inputSelectors)
    expect(createSelector).toHaveBeenCalledWith(expect.anything(), returnOfSelector);
  });
});
