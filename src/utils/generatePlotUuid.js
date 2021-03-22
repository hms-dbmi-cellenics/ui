const generatePlotUuid = (sampleId, filterName, plotIdx) => {
  if (sampleId) {
    return `${sampleId}-${filterName}-${plotIdx}`;
  }
  return `${filterName}-${plotIdx}`;
};

export default generatePlotUuid;
