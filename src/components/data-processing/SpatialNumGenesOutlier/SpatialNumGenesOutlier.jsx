import React from 'react';
import PropTypes from 'prop-types';

import SpatialOutlierFilter from 'components/data-processing/SpatialOutlierFilter/SpatialOutlierFilter';

// Visium HD spatial number-of-genes local-outlier filter: removes cells with
// unusually few detected genes relative to their spatial neighborhood
// (log scale, lower tail).
const SpatialNumGenesOutlier = ({
  experimentId, sampleId, sampleIds, onConfigChange, stepDisabled, stepHadErrors,
}) => (
  <SpatialOutlierFilter
    experimentId={experimentId}
    sampleId={sampleId}
    sampleIds={sampleIds}
    onConfigChange={onConfigChange}
    stepDisabled={stepDisabled}
    stepHadErrors={stepHadErrors}
    filterName='spatialNumGenesOutlier'
    direction='lower'
    mainPlotType='spatialNumGenesOutlierPlot'
    outlierPlotType='spatialNumGenesOutlierHighlightPlot'
    histogramPlotType='spatialNumGenesOutlierZscoreHistogram'
    mainPlotTitle='Genes detected'
    histogramTitle='Genes detected outlier z-scores'
  />
);

SpatialNumGenesOutlier.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  sampleIds: PropTypes.array.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  stepDisabled: PropTypes.bool,
  stepHadErrors: PropTypes.bool.isRequired,
};

SpatialNumGenesOutlier.defaultProps = {
  stepDisabled: false,
};

export default SpatialNumGenesOutlier;
