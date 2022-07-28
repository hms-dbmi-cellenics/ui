import { SparseMatrix, Index, Range } from 'mathjs';

const getRow = (rowIndex, sparseMatrix) => {
  const [, cellsCount] = sparseMatrix.size();

  return sparseMatrix.subset(Index(rowIndex, Range(0, cellsCount)));
};

const setRow = (rowIndex, newRow, sparseMatrix) => {
  const [, cellsCount] = sparseMatrix.size();

  sparseMatrix.subset(Index(rowIndex, Range(0, cellsCount)), newRow);
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
    const a = getRow(geneIndex, this.rawGeneExpressions).toValue()[0];

    console.log('aDebug');
    console.log(a);
    return a;
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
    newGeneSymbols.forEach((geneSymbol, index) => {
      // Get new gene expression
      const newRawGeneExpressionRow = getRow(index, newRawGeneExpression);
      const newTruncatedGeneExpressionRow = getRow(index, newTruncatedGeneExpression);

      // And store it in the matrix
      const geneIndex = this.getIndexFor(geneSymbol);
      setRow(geneIndex, newRawGeneExpressionRow, this.rawGeneExpressions);
      setRow(geneIndex, newTruncatedGeneExpressionRow, this.truncatedGeneExpressions);
    });
  }

  /**
   * If the gene already has an assigned index, it returns it.
   * If it doesn't, it generates a new one for it
   *
   * @param {*} geneSymbol The symbol of the gene
   * @returns The index of the gene inside the raw and truncated matrixes
   */
  getIndexFor(geneSymbol) {
    // If not loaded, assign an index to it
    if (!this.loadedExpressionsIndexes[geneSymbol]) {
      this.loadedExpressionsIndexes[geneSymbol] = this.lastFreeIndex;

      // This index is now assigned, so move it one step
      this.lastFreeIndex += 1;
    }

    return this.loadedExpressionsIndexes[geneSymbol];
  }
}

export default ExpressionMatrix;
