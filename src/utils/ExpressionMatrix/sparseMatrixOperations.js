/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import { Index, Range } from 'mathjs';

/**
 * Mutates sparseMatrix1
 * Appends the columns at columnIndexes of sparseMatrix2 into sparseMatrix1.
 * This method works using the class SparseMatrix of mathjs,
 * which use the structure Compressed Column Matrix,
 * it is efficient at adding/accessing columns
 *
 * Using algorithms provided by mathjs for SparseMatrix should be done with caution,
 * some of them are not guaranteed to preserve a specific index order.
 * More info: https://github.com/josdejong/mathjs/issues/450#issuecomment-137060600
 *
 * @param {*} sparseMatrix1 Matrix to receive the new columns, mutates
 * @param {*} sparseMatrix2 Matrix with the columns to append
 * @param {*} columnIndexes Indexes of the columns from sparseMatrix2 to append to sparseMatrix1
 */
const appendColumns = (sparseMatrix1, sparseMatrix2, columnIndexes) => {
  columnIndexes.forEach((columnIndex) => {
    // Indexes at which the column begins and ends
    const startIndex = sparseMatrix2._ptr[columnIndex];
    const endIndex = sparseMatrix2._ptr[columnIndex + 1];

    // Concatenate the _index and _values we need to for this column
    sparseMatrix1._index = sparseMatrix1._index.concat(
      sparseMatrix2._index.slice(startIndex, endIndex),
    );
    sparseMatrix1._values = sparseMatrix1._values.concat(
      sparseMatrix2._values.slice(startIndex, endIndex),
    );

    const amountOfNewValues = endIndex - startIndex;

    // Store the amount of new values in ptr
    sparseMatrix1._ptr.push(_.last(sparseMatrix1._ptr) + amountOfNewValues);
  });

  // We added columnIndexes.length columns
  sparseMatrix1._size[1] += columnIndexes.length;
};

const getColumn = (
  columnIndex,
  sparseMatrix,
  rowIndexes = new Range(0, sparseMatrix.size()[0]),
) => sparseMatrix.subset(new Index(rowIndexes, columnIndex));

// eslint-disable-next-line import/prefer-default-export
export { appendColumns, getColumn };
