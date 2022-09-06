/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import _ from 'lodash';
import { SparseMatrix } from 'mathjs';
import * as math from 'mathjs';

const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

const genesExpressionLoaded = produce((draft, action) => {
  const {
    componentUuid, genes: geneSymbols, data,
    loadingStatus = _.difference(
      upperCaseArray(original(draft.expression.loading)), upperCaseArray(geneSymbols),
    ),
  } = action.payload;

  // If there's any data to load, load it
  if (Object.keys(data).length > 0) {
    // All of this code preparing the matrixes is unnecessary
    // once the worker sends us a sparse matrix
    const rawExpressions = [];
    const truncatedExpressions = [];

    geneSymbols.forEach((geneSymbol) => {
      rawExpressions.push(data[geneSymbol].rawExpression.expression.map((val) => val ?? 0));
      truncatedExpressions.push(
        data[geneSymbol].truncatedExpression.expression.map((val) => val ?? 0),
      );
    });

    const rawSparseMatrix = math.transpose(new SparseMatrix(rawExpressions));
    const truncatedSparseMatrix = math.transpose(new SparseMatrix(truncatedExpressions));

    const expressionMatrix = original(draft).expression.matrix;

    expressionMatrix.pushGeneExpression(
      geneSymbols,
      rawSparseMatrix,
      truncatedSparseMatrix,
      // stats,
    );
  }

  draft.expression.views[componentUuid].fetching = false;
  draft.expression.views[componentUuid].error = false;
  draft.expression.views[componentUuid].data = geneSymbols;

  draft.expression.loading = loadingStatus;
});

export default genesExpressionLoaded;
