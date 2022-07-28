import _ from 'lodash';
import { SparseMatrix, Index, Range } from 'mathjs';

const getRow = (rowIndex, sparseMatrix) => {
  const [, cellsCount] = sparseMatrix.size();
  return sparseMatrix.subset(new Index(rowIndex, new Range(0, cellsCount)));
};

const setRow = (rowIndex, newRow, sparseMatrix) => {
  const [, cellsCount] = sparseMatrix.size();

  sparseMatrix.subset(new Index(rowIndex, new Range(0, cellsCount)), newRow);
};

class ExpressionMatrix {
  constructor() {
    this.lastFreeIndex = 0;

    this.loadedExpressionsIndexes = {};

    this.rawGeneExpressions = new SparseMatrix();
    this.truncatedGeneExpressions = new SparseMatrix();
    // this.zscore = new SparseMatrix();
  }

  getRawExpression(geneSymbol) {
    const geneIndex = this.getIndexFor(geneSymbol);

    if (_.isNil(geneIndex)) return undefined;

    return getRow(geneIndex, this.rawGeneExpressions).valueOf()[0];
  }

  getTruncatedExpression(geneSymbol) {
    const geneIndex = this.getIndexFor(geneSymbol);

    if (_.isNil(geneIndex)) return undefined;

    return getRow(geneIndex, this.truncatedGeneExpressions).valueOf()[0];
  }

  geneIsLoaded(geneSymbol) {
    return !_.isNil(this.loadedExpressionsIndexes[geneSymbol]);
  }

  /**
   *
   * @param {*} newGeneSymbols A row with the gene symbols corresponding
   * to each row in the geneExpressions (in the same order)
   * @param {*} newRawGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   * @param {*} newTruncatedGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   */
  pushGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression) {
    const [, cellsCount] = this.rawGeneExpressions.size();

    // If the matrix was empty previously we need to set the correct column size
    if (cellsCount === 0) {
      const [, newCellsCount] = newRawGeneExpression.size();

      this.rawGeneExpressions.resize([0, newCellsCount]);
      this.truncatedGeneExpressions.resize([0, newCellsCount]);
    }

    newGeneSymbols.forEach((geneSymbol, index) => {
      // Get new gene expression
      const newRawGeneExpressionRow = getRow(index, newRawGeneExpression);
      const newTruncatedGeneExpressionRow = getRow(index, newTruncatedGeneExpression);

      // And store it in the matrix
      const geneIndex = this.generateIndexFor(geneSymbol);
      setRow(geneIndex, newRawGeneExpressionRow, this.rawGeneExpressions);
      setRow(geneIndex, newTruncatedGeneExpressionRow, this.truncatedGeneExpressions);
    });
  }

  getIndexFor(geneSymbol) {
    return this.loadedExpressionsIndexes[geneSymbol];
  }

  /**
   * If the gene already has an assigned index, it returns it.
   * If it doesn't, it generates a new one for it
   *
   * @param {*} geneSymbol The symbol of the gene
   * @returns The index of the gene inside the raw and truncated matrixes
   */
  generateIndexFor(geneSymbol) {
    // If not loaded, assign an index to it
    if (_.isNil(this.loadedExpressionsIndexes[geneSymbol])) {
      this.loadedExpressionsIndexes[geneSymbol] = this.lastFreeIndex;

      // This index is now assigned, so move it one step
      this.lastFreeIndex += 1;
    }

    return this.loadedExpressionsIndexes[geneSymbol];
  }
}

export default ExpressionMatrix;
