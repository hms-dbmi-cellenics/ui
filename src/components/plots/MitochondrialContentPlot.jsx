import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateMitochondrialContentSpec';

import Loader from '../Loader';

const MitochondrialContentPlot = (props) => {
  const { experimentId, config, plotData } = props;

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (plotData) {
      setPlotSpec(generateSpec(config, plotData));
    }
  }, [plotData]);

  const render = () => {
    if (!plotData) {
      return (
        <center>
          <Loader experimentId={experimentId} size='large' />
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' />
      </center>
    );
  };

  return (
    <>
      { render()}
    </>
  );
};

MitochondrialContentPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
};

MitochondrialContentPlot.defaultProps = {
  plotData: null,
};

export default MitochondrialContentPlot;
