import React from 'react';
import PropTypes from 'prop-types';

import SpatialOutlierFilter from 'components/data-processing/SpatialOutlierFilter/SpatialOutlierFilter';

// Visium HD spatial UMI local-outlier filter: removes cells with unusually low
// total UMI count relative to their spatial neighborhood (log scale, lower tail).
const SpatialUmiOutlier = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => (
  <SpatialOutlierFilter
    experimentId={experimentId}
    sampleId={sampleId}
    sampleIds={sampleIds}
    onConfigChange={onConfigChange}
    stepDisabled={stepDisabled}
    stepHadErrors={stepHadErrors}
    filterName='spatialUmiOutlier'
    direction='lower'
    mainPlotType='spatialUmiOutlierPlot'
    outlierPlotType='spatialUmiOutlierHighlightPlot'
    histogramPlotType='spatialUmiOutlierZscoreHistogram'
    mainPlotTitle='UMIs'
    histogramTitle='UMI outlier z-scores'
  />
);

SpatialUmiOutlier.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

SpatialUmiOutlier.defaultProps = {
  stepDisabled: false,
};

export default SpatialUmiOutlier;
