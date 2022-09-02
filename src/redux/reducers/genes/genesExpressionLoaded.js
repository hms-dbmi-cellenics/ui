/* eslint-disable no-param-reassign */
// import produce, { original } from 'immer';
import _ from 'lodash';
import { SparseMatrix } from 'mathjs';
import { initialViewState } from './initialState';

// const genesExpressionLoaded = produce((draft, action) => {
//   const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

//   const {
//     data, componentUuid, genes,
//     loadingStatus = _.difference(upperCaseArray
// (state.expression.loading), upperCaseArray(genes)),
//   } = action.payload;

//   console.log('genesDebug');
//   console.log(genes);

//   console.log('[DEBUG] - BEGUN GETTING GENE EXPRESSION MATRIX');
//   // const expressionMatrix = original(draft).expression.matrix;
//   console.log('[DEBUG] - FINISHED GETTING GENE EXPRESSION MATRIX');

//   console.log('[DEBUG] - BEGUN SETTING GENE EXPRESSION MATRIX');

//   // expressionMatrix.pushGeneExpression(
//   //   order,
//   //   rawExpression,
//   //   truncatedExpression,
//   //   stats,
//   // );
//   // console.log('[DEBUG] - FINISHED SETTING GENE EXPRESSION');

//   // draft.expression.views[plotUuid] = { fetching: false, error: false, data: order };

//   draft.markers.loading = false;
//   draft.markers.error = false;
// });

const genesExpressionLoaded = (state, action) => {
  const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

  const {
    data, componentUuid, genes,
    loadingStatus = _.difference(upperCaseArray(state.expression.loading), upperCaseArray(genes)),
  } = action.payload;

  console.log('genesDebug');
  console.log(genes);

  console.log('dataDebug');
  console.log(data);

  const { rawExpression, truncatedExpression } = data[genes[0]];

  const rawSparseMatrix = new SparseMatrix(rawExpression.expression.map((val) => val ?? 0));
  const truncatedSparseMatrix = new SparseMatrix(
    truncatedExpression.expression.map((val) => val ?? 0),
  );

  console.log('rawSparseMatrixtruncatedSparseMatrixDebug');
  console.log(rawSparseMatrix, truncatedSparseMatrix);

  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.expression.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.expression.views[componentUuid],
          fetching: false,
          error: false,
          data: genes,
        },
      },
      data: {
        ...state.expression.data,
        ...data,
      },
      loading: loadingStatus,
    },
  };
};

export default genesExpressionLoaded;
