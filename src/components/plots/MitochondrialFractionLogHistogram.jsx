import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateMitochondrialFractionScatterplot';

import { loadPlotConfig } from '../../redux/actions/componentConfig';

const MitochondrialFractionScatterplot = (props) => {
  const {
    experimentId, config, plotData, actions,
  } = props;
  const plotUuid = 'mitochondrialFractionLogHistogram';
  const plotType = 'mitochondrialFractionLogHistogram';

  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState(config);
  const plotComponent = useSelector((state) => state.componentConfig.mitochondrialFractionLogHistogram);

  useEffect(() => {
    if (config && plotData) {
      setPlotSpec(generateSpec(config, plotData));
    }
  }, [config, plotData]);

  const render = () => {
    if (!plotData?.length) {
      return (
        <PlatformError
          description='No data to show. Please run the pipeline again.'
          onClick={() => { dispatch(loadPlotConfig(experimentId, plotUuid, plotType)); }}
        />
      );
    }

    if (!plotComponent) {
      return (
        <PlatformError
          description='Failed loading plot data'
          onClick={() => { dispatch(loadPlotConfig(experimentId, plotUuid, plotType)); }}
        />
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' actions={actions} />
      </center>
    );
  };

  return (
    <>
      { render()}
    </>
  );
};

MitochondrialFractionScatterplot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

MitochondrialFractionScatterplot.defaultProps = {
  plotData: null,
  actions: true,
};

export default MitochondrialFractionScatterplot;
