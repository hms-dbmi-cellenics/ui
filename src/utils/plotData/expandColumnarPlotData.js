// The pipeline sends full per-cell spatial QC plot data as columns,
// `{ columnar: { cellId: [...], raw: [...], ... }, valueTransform }`, instead of
// one object per cell (far smaller to transfer). Expand it back into the per-cell
// records the plots expect. Anything else (including older experiments' record
// arrays) is returned unchanged.
//
// `value` (what the slide is coloured by) isn't sent when it can be derived from
// `raw`: `valueTransform` says how ("log1p" or "none").
const valueTransforms = {
  log1p: Math.log1p,
  none: (raw) => raw,
};

const expandColumnarPlotData = (plotData) => {
  const columns = plotData?.columnar;
  if (!columns || Array.isArray(plotData) || typeof columns !== 'object') return plotData;

  const names = Object.keys(columns);
  // a scalar is a single-cell column (older serialisers unbox length-1 vectors)
  const arrays = names.map((name) => [].concat(columns[name] ?? []));
  const length = Math.max(0, ...arrays.map((arr) => arr.length));

  const transform = valueTransforms[plotData.valueTransform];
  const deriveValue = transform && !names.includes('value') && names.includes('raw');

  return Array.from({ length }, (_, i) => {
    const record = {};
    names.forEach((name, j) => { record[name] = arrays[j][i] ?? null; });
    if (deriveValue) record.value = record.raw === null ? null : transform(record.raw);
    return record;
  });
};

export default expandColumnarPlotData;
