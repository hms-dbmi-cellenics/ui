import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateClassifierEmptyDropsPlot';

import { loadPlotConfig } from '../../redux/actions/componentConfig';

const ClassifierEmptyDropsPlot = (props) => {
  const { experimentId, config, plotData } = props;
  const plotUuid = 'classifierEmptyDropsPlot';
  const plotType = 'classifierEmptyDropsPlot';

  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState(config);

  useEffect(() => {
    setPlotSpec(generateSpec(config, plotData));
  }, [config, plotData]);

  const render = () => {
    if (!plotData.length) {
      return (
        <PlatformError
          description='No data to show. Please run the pipeline again.'
          onClick={() => { dispatch(loadPlotConfig(experimentId, plotUuid, plotType)); }}
        />
      );
    }

    if (!config) {
      return (
        <PlatformError
          description='Failed loading plot data'
          onClick={() => { dispatch(loadPlotConfig(experimentId, plotUuid, plotType)); }}
        />
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' actions />
      </center>
    );
  };

  return (
    <>
      { render()}
    </>
  );
};

ClassifierEmptyDropsPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
};

ClassifierEmptyDropsPlot.defaultProps = {
  plotData: null,
};

export default ClassifierEmptyDropsPlot;
