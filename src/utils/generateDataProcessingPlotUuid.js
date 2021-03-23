const generateDataProcessingPlotUuid = (sampleId, filterName, plotIdx) => {
  if (sampleId) {
    return `${sampleId}-${filterName}-${plotIdx}`;
  }
  return `${filterName}-${plotIdx}`;
};

export default generateDataProcessingPlotUuid;
