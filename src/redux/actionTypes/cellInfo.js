const CELL_INFO = 'cellInfo';

/**
 * Update cell information on currently highlighted cell.
 */
const CELL_INFO_UPDATE = `${CELL_INFO}/update`;

/**
 * Set focus on a particular metadata/cell set/gene.
 */
const CELL_INFO_FOCUS = `${CELL_INFO}/focus`;

/**
 * Set focus on a particular cell set or gene.
 */

const CELL_INFO_UNFOCUS = `${CELL_INFO}/unfocus`;

export {
  CELL_INFO_UPDATE, CELL_INFO_FOCUS, CELL_INFO_UNFOCUS,
};
