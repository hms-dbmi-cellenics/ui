import differentialExpressionReducer from 'redux/reducers/differentialExpression';
import initialState from 'redux/reducers/differentialExpression/initialState';

import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
  DIFF_EXPR_COMPARISON_TYPE_SET, DIFF_EXPR_COMPARISON_GROUP_SET,
} from 'redux/actionTypes/differentialExpression';
import { CELL_CLASS_DELETE, CELL_SETS_LOADED } from 'redux/actionTypes/cellSets';

const stateWithComparison = (group) => ({
  ...initialState,
  comparison: {
    ...initialState.comparison,
    type: 'between',
    group: {
      ...initialState.comparison.group,
      between: group,
    },
  },
});

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
        advancedFilters: [{ columnName: 'foo', columnValue: 'bar' }],
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
            logFC: 3.45,
            p_val: 1.16,
            p_val_adj: 2.16,
          },
          {
            gene_names: 'B',
            logFC: 4.45,
            p_val: 2.16,
            p_val_adj: 3.16,
          },
          {
            gene_names: 'C',
            logFC: 5.45,
            p_val: 3.16,
            p_val_adj: 4.16,
          },
          {
            gene_names: 'D',
            logFC: 6.45,
            p_val: 4.16,
            p_val_adj: 5.16,
          },
          {
            gene_names: 'E',
            logFC: 7.45,
            p_val: 5.16,
            p_val_adj: 6.16,
          },
          {
            gene_names: 'F',
            logFC: 8.45,
            p_val: 6.16,
            p_val_adj: 7.16,
          },
        ],
        total: 6,
        type: 'between',
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

  it('Clears the selections of a deleted cell class', () => {
    const newState = differentialExpressionReducer(
      stateWithComparison({
        basis: 'annotations/annotation-a',
        cellSet: 'sample/sample-a',
        compareWith: 'sample/sample-b',
      }),
      {
        type: CELL_CLASS_DELETE,
        payload: { experimentId: '1234', key: 'annotations' },
      },
    );

    expect(newState.comparison.group.between).toEqual({
      basis: null,
      cellSet: 'sample/sample-a',
      compareWith: 'sample/sample-b',
    });
  });

  it('Clears the selections that no longer exist when cell sets are loaded', () => {
    const newState = differentialExpressionReducer(
      stateWithComparison({
        basis: 'louvain/louvain-42',
        cellSet: 'sample/sample-a',
        compareWith: 'rest',
      }),
      {
        type: CELL_SETS_LOADED,
        payload: {
          experimentId: '1234',
          data: [
            { key: 'louvain', children: [{ key: 'louvain-0' }] },
            { key: 'sample', children: [{ key: 'sample-a' }, { key: 'sample-b' }] },
          ],
        },
      },
    );

    // The cell set that isn't in the new cell sets is cleared, the others are kept
    expect(newState.comparison.group.between).toEqual({
      basis: null,
      cellSet: 'sample/sample-a',
      compareWith: 'rest',
    });
  });
});
