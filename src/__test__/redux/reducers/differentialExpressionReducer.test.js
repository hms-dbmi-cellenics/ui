import differentialExpressionReducer from '../../../redux/reducers/differentialExpression';
import initialState from '../../../redux/reducers/differentialExpression/initialState';

import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
  DIFF_EXPR_COMPARISON_TYPE_SET, DIFF_EXPR_COMPARISON_GROUP_SET,
} from '../../../redux/actionTypes/differentialExpression';

describe('differentialExpressionReducer', () => {
  it('Reduces identical state on unknown action', () => expect(
    differentialExpressionReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Sets loading state on loading action', () => {
    const newState = differentialExpressionReducer(initialState, {
      type: DIFF_EXPR_LOADING,
      payload: {
        experimentId: '1234',
      },
    });

    expect(newState.properties.loading).toEqual(true);
    expect(newState).toMatchSnapshot();
  });

  it('Sets loaded state on loaded action', () => {
    const newState = differentialExpressionReducer(initialState, {
      type: DIFF_EXPR_LOADED,
      payload: {
        cellSets: {
          first: 'louvain-0',
          second: 'louvain-1',
        },
        experimentId: '1234',
        data: [
          {
            gene_names: 'A',
            log2fc: 3.45,
            pval: 1.16,
            qval: 2.16,
          },
          {
            gene_names: 'B',
            log2fc: 4.45,
            pval: 2.16,
            qval: 3.16,
          },
          {
            gene_names: 'C',
            log2fc: 5.45,
            pval: 3.16,
            qval: 4.16,
          },
          {
            gene_names: 'D',
            log2fc: 6.45,
            pval: 4.16,
            qval: 5.16,
          },
          {
            gene_names: 'E',
            log2fc: 7.45,
            pval: 5.16,
            qval: 6.16,
          },
          {
            gene_names: 'F',
            log2fc: 8.45,
            pval: 6.16,
            qval: 7.16,
          },
        ],
        total: 6,
      },
    });

    expect(newState.properties.loading).toEqual(false);
    expect(newState).toMatchSnapshot();
  });

  it('Sets error state on error action', () => {
    const newState = differentialExpressionReducer(initialState, {
      type: DIFF_EXPR_ERROR,
      payload: {
        cellSets: {
          first: 'louvain-0',
          second: 'louvain-1',
        },
        experimentId: '1234',
        error: 'asd',
      },
    });

    expect(newState).toMatchSnapshot();
  });

  it('Sets the correct comparison type', () => {
    const newType = 'testState';

    const newState = differentialExpressionReducer(initialState, {
      type: DIFF_EXPR_COMPARISON_TYPE_SET,
      payload: {
        type: newType,
      },
    });

    const result = {
      ...initialState,
      comparison: {
        ...initialState.comparison,
        type: newType,
      },
    };

    expect(newState).toEqual(result);
  });

  it('Reduces to the correct chosen group ', () => {
    const newType = 'testGroup';
    const newGroup = {
      [newType]: {
        cellSet: 'newCellSet',
        compareWith: 'newCompareWith',
        basis: 'newBasis',
      },
    };

    const newState = differentialExpressionReducer(initialState, {
      type: DIFF_EXPR_COMPARISON_GROUP_SET,
      payload: {
        type: newType,
        ...newGroup.testGroup,
      },
    });

    const result = {
      ...initialState,
      comparison: {
        ...initialState.comparison,
        type: newType,
        group: {
          ...initialState.comparison.group,
          ...newGroup,
        },
      },
    };

    expect(newState).toEqual(result);
  });
});
