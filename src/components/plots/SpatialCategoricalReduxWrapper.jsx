import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import SpatialCategoricalPlot from './SpatialCategoricalPlot';

// wrapper component used in plots and tables
// where the data for the embedding needs to be derived from redux
// on change rerendering the component
const SpatialCategoricalReduxWrapper = (props) => {
  const {
    experimentId, actions, plotUuid,
  } = props;

  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);

  return (
    <SpatialCategoricalPlot
      experimentId={experimentId}
      config={config}
      actions={actions}
    />
  );
};
SpatialCategoricalReduxWrapper.defaultProps = {
  actions: true,
};
SpatialCategoricalReduxWrapper.propTypes = {
  experimentId: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  plotUuid: PropTypes.string.isRequired,
};
export default SpatialCategoricalReduxWrapper;
