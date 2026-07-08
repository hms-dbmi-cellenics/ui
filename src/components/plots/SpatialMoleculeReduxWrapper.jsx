import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import SpatialMoleculePlot from './SpatialMoleculePlot';

// wrapper component used in plots and tables: derives the plot config from redux
// and persists zoom / default-sample writes back.
const SpatialMoleculeReduxWrapper = (props) => {
  const { experimentId, actions, plotUuid } = props;

  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  return (
    <SpatialMoleculePlot
      experimentId={experimentId}
      config={config}
      actions={actions}
      onZoomChange={(axesRanges) => dispatch(updatePlotConfig(plotUuid, { axesRanges }))}
      onSampleDefault={(selectedSample) => dispatch(
        updatePlotConfig(plotUuid, { selectedSample }),
      )}
      onDefaultGenes={(selectedGenes) => dispatch(
        updatePlotConfig(plotUuid, { selectedGenes }),
      )}
      onDefaultColors={(geneColors) => dispatch(
        updatePlotConfig(plotUuid, { geneColors }),
      )}
    />
  );
};

SpatialMoleculeReduxWrapper.defaultProps = {
  actions: true,
};
SpatialMoleculeReduxWrapper.propTypes = {
  experimentId: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  plotUuid: PropTypes.string.isRequired,
};
export default SpatialMoleculeReduxWrapper;
