/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/**
 * Mutates sparseMatrix1
 * Appends the columns of sparseMatrix2 into sparseMatrix1.
 * This method works using the SparseMatrix's of mathjs,
 * which use the structure Compressed Column Matrix,
 * it is efficient at adding/accessing new columns
 *
 * @param {*} sparseMatrix1 Matrix to receive the new columns
 * @param {*} sparseMatrix2 Matrix with the columns to append
 */
const appendMatrix = (sparseMatrix1, sparseMatrix2) => {
  // Check they have the same cell size
  if (sparseMatrix1.size()[0] !== sparseMatrix2.size()[0]) {
    throw new Error('Append matrix error: Amount of cells doesnt match');
  }

  sparseMatrix1._index = sparseMatrix1._index.concat(sparseMatrix2._index);
  sparseMatrix1._values = sparseMatrix1._values.concat(sparseMatrix2._values);

  const nonZeroValuesLength = sparseMatrix1._values.length;

  sparseMatrix2._ptr.forEach((value, i) => {
    if (i !== 0) sparseMatrix1._ptr.push(value);
  });

  sparseMatrix1._ptr = sparseMatrix1._ptr.concat(sparseMatrix2._ptr.map(
    (index) => index + nonZeroValuesLength,
  ));

  // Add the amount of new columns
  sparseMatrix1._size[1] += sparseMatrix2._size[1];
};

// eslint-disable-next-line import/prefer-default-export
export { appendMatrix };
