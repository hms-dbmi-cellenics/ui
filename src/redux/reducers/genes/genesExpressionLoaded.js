/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

const genesExpressionLoaded = produce((draft, action) => {
  const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

  const {
    data, componentUuid, genes,
    loadingStatus = _.difference(
      upperCaseArray(original(draft.expression.loading)), upperCaseArray(genes),
    ),
  } = action.payload;

  const { rawExpression, truncatedExpression } = data[genes[0]];

  const rawSparseMatrix = new SparseMatrix(
    rawExpression.expression.map((val) => val ?? 0),
  );

  const truncatedSparseMatrix = new SparseMatrix(
    truncatedExpression.expression.map((val) => val ?? 0),
  );

  const expressionMatrix = original(draft).expression.matrix;

  expressionMatrix.pushGeneExpression(
    genes,
    rawSparseMatrix,
    truncatedSparseMatrix,
    // stats,
  );

  draft.expression.views[componentUuid].fetching = false;
  draft.expression.views[componentUuid].error = false;
  draft.expression.views[componentUuid].data = genes;

  draft.expression.loading = data;
  draft.expression.data = loadingStatus;
});

export default genesExpressionLoaded;
