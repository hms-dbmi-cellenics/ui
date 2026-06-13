import React from 'react';
import PropTypes from 'prop-types';

import SpatialOutlierFilter from 'components/data-processing/SpatialOutlierFilter/SpatialOutlierFilter';

// Visium HD spatial mitochondrial-content local-outlier filter: removes cells
// with unusually high mitochondrial content relative to their spatial
// neighborhood (not log scale, upper tail).
const SpatialMitoOutlier = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => (
  <SpatialOutlierFilter
    experimentId={experimentId}
    sampleId={sampleId}
    sampleIds={sampleIds}
    onConfigChange={onConfigChange}
    stepDisabled={stepDisabled}
    stepHadErrors={stepHadErrors}
    filterName='spatialMitoOutlier'
    direction='upper'
    mainPlotType='spatialMitoOutlierPlot'
    outlierPlotType='spatialMitoOutlierHighlightPlot'
    histogramPlotType='spatialMitoOutlierZscoreHistogram'
    mainPlotTitle='Mitochondrial %'
    histogramTitle='Mitochondrial outlier z-scores'
  />
);

SpatialMitoOutlier.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

SpatialMitoOutlier.defaultProps = {
  stepDisabled: false,
};

export default SpatialMitoOutlier;
