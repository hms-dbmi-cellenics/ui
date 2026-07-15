// Grid placement for the multi-sample spatial view.
//
// The tissue images, segmentation bitmasks, cell centroids and molecule points
// are all laid out on a shared grid keyed by sample index (the order of
// omeZarrSampleIds). This helper produces the single source of truth all of
// those consumers use so they stay aligned:
//   - gridShape:          [numRows, numColumns]
//   - slotToSampleIndex:  length numRows*numColumns; slot -> sample index, or
//                         null for an empty "filler" cell
//   - sampleRowCol:       length numSamples; sample index -> { row, col }
//
// Ungrouped (default when no metadata grouping is selected): dense row-major
// with at most MAX_UNGROUPED_COLUMNS per row. Samples are placed in
// orderedSampleIndices order (the Cell sets & metadata tile's sample order);
// defaults to natural index order when not provided.
//
// Grouped: one row per group, in the given group order; a group's samples fill
// columns left-to-right (in the order given in sampleIndices); the grid is as
// wide as the largest group, so smaller groups leave empty filler cells at the
// end of their row.

const MAX_UNGROUPED_COLUMNS = 4;

const buildSpatialGridLayout = (numSamples, groups = null, orderedSampleIndices = null) => {
  const sampleRowCol = new Array(numSamples).fill(null);

  if (!groups || groups.length === 0) {
    const order = orderedSampleIndices
      ?? Array.from({ length: numSamples }, (_, i) => i);
    const numColumns = Math.min(Math.max(order.length, 1), MAX_UNGROUPED_COLUMNS);
    const numRows = Math.max(1, Math.ceil(order.length / numColumns));
    const slotToSampleIndex = new Array(numRows * numColumns).fill(null);

    order.forEach((sampleIndex, slot) => {
      const row = Math.floor(slot / numColumns);
      const col = slot % numColumns;
      slotToSampleIndex[slot] = sampleIndex;
      sampleRowCol[sampleIndex] = { row, col };
    });

    return { gridShape: [numRows, numColumns], slotToSampleIndex, sampleRowCol };
  }

  const numRows = groups.length;
  const numColumns = Math.max(1, ...groups.map((group) => group.sampleIndices.length));
  const slotToSampleIndex = new Array(numRows * numColumns).fill(null);

  groups.forEach((group, row) => {
    group.sampleIndices.forEach((sampleIndex, col) => {
      slotToSampleIndex[row * numColumns + col] = sampleIndex;
      sampleRowCol[sampleIndex] = { row, col };
    });
  });

  return { gridShape: [numRows, numColumns], slotToSampleIndex, sampleRowCol };
};

export default buildSpatialGridLayout;
export { MAX_UNGROUPED_COLUMNS };
