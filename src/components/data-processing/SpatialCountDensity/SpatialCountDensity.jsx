import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import generateCountDensityHistogram, { getCountDensityThreshold } from 'utils/plotSpecs/generateCountDensityHistogram';
import SpatialOutlierFilter from 'components/data-processing/SpatialOutlierFilter/SpatialOutlierFilter';
import CalculationConfig from './CalculationConfig';

const filterName = 'spatialCountDensity';

// Xenium count-density filter (OSTA imaging QC): removes cells whose log count
// density (counts per um^2 of cell area) is a 3-MAD low outlier for the sample,
// and cells with control probe or codeword counts above a maximum.
const SpatialCountDensity = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => {
  // the histogram data carries the median and MAD needed to turn nmads into a
  // threshold, so the slides recompute outliers as the settings change
  const densityStats = useSelector((state) => state.componentConfig[
    generateDataProcessingPlotUuid(sampleId, filterName, 1)
  ]?.plotData);
  const nmads = useSelector(
    (state) => state.experimentSettings.processing[filterName]?.[sampleId]?.filterSettings?.nmads,
  );

  const getOutlierRule = (config) => ({
    method: 'countDensity',
    threshold: getCountDensityThreshold(densityStats, config.nmads) ?? -Infinity,
    maxControls: config.filterControls ? config.maxControlCounts : null,
  });

  return (
    <SpatialOutlierFilter
      experimentId={experimentId}
      sampleId={sampleId}
      sampleIds={sampleIds}
      onConfigChange={onConfigChange}
      stepDisabled={stepDisabled}
      stepHadErrors={stepHadErrors}
      filterName={filterName}
      direction='lower'
      mainPlotType='spatialCountDensityPlot'
      outlierPlotType='spatialCountDensityHighlightPlot'
      histogramPlotType='spatialCountDensityHistogram'
      mainPlotTitle='log(counts / µm²)'
      histogramTitle='Count density distribution'
      getOutlierRule={getOutlierRule}
      generateHistogram={generateCountDensityHistogram}
      calculationConfig={(
        <CalculationConfig threshold={getCountDensityThreshold(densityStats, nmads)} />
      )}
    />
  );
};

SpatialCountDensity.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

SpatialCountDensity.defaultProps = {
  stepDisabled: false,
};

export default SpatialCountDensity;
