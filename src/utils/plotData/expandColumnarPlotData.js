// The pipeline sends full per-cell spatial QC plot data as columns,
// `{ columnar: { cellId: [...], value: [...], x: [...], ... } }`, instead of one
// object per cell (far smaller to transfer). Expand it back into the per-cell
// records the plots expect. Anything else (including older experiments' record
// arrays) is returned unchanged.
const expandColumnarPlotData = (plotData) => {
  const columns = plotData?.columnar;
  if (!columns || Array.isArray(plotData) || typeof columns !== 'object') return plotData;

  const names = Object.keys(columns);
  // a scalar is a single-cell column (older serialisers unbox length-1 vectors)
  const arrays = names.map((name) => [].concat(columns[name] ?? []));
  const length = Math.max(0, ...arrays.map((arr) => arr.length));

  return Array.from({ length }, (_, i) => {
    const record = {};
    names.forEach((name, j) => { record[name] = arrays[j][i] ?? null; });
    return record;
  });
};

export default expandColumnarPlotData;
