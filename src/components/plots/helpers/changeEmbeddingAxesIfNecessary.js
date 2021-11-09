const changeEmbeddingAxesIfNecessary = (config, method, onUpdate) => {
  if (!config || !method) return;
  const { defaultValues: axesDefaultValues, xAxisText, yAxisText } = config?.axes;

  if (axesDefaultValues?.length) {
    const methodUppercase = method[0].toUpperCase() + method.slice(1);
    if (axesDefaultValues.includes('x') && !xAxisText.includes(methodUppercase)) {
      onUpdate({ axes: { xAxisText: `${methodUppercase} 1` } });
    }
    if (axesDefaultValues.includes('y') && !yAxisText.includes(methodUppercase)) {
      onUpdate({ axes: { yAxisText: `${methodUppercase} 2` } });
    }
  }
};
export default changeEmbeddingAxesIfNecessary;
