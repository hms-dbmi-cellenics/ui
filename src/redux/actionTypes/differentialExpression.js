const DIFF_EXPR = 'diffExpr';

/**
 * Turns on the loading condition for differential expression.
 * Components that have the particular properties requested in their dependencies
 * should set a loading state at this event.
 */
const DIFF_EXPR_LOADING = `${DIFF_EXPR}/loading`;

/**
 * Sets the state of the differential expression data to be successfully loaded.
 * This is meant to be used for paginated data, where the data is
 * lazy-loaded by an API call or equivalent.
 */
const DIFF_EXPR_LOADED = `${DIFF_EXPR}/loaded`;

const DIFF_EXPR_ERROR = `${DIFF_EXPR}/error`;

/**
 * Sets the state for diffential expression settings
 *
 */
const DIFF_EXPR_COMPARISON_TYPE_SET = `${DIFF_EXPR}/comparisonType`;
const DIFF_EXPR_COMPARISON_GROUP_SET = `${DIFF_EXPR}/comparisonGroup`;

export {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
  DIFF_EXPR_COMPARISON_TYPE_SET, DIFF_EXPR_COMPARISON_GROUP_SET,
};
