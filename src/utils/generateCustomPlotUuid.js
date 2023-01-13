const generateDataProcessingPlotUuid = (sampleId, filterName, plotIdx) => {
  if (sampleId) {
    return `${sampleId}-${filterName}-${plotIdx}`;
  }
  return `${filterName}-${plotIdx}`;
};

const generateMultiViewGridPlotUuid = (plotUuid, plotIdx) => (
  `${plotUuid}-${plotIdx}`
);

export { generateDataProcessingPlotUuid, generateMultiViewGridPlotUuid };
