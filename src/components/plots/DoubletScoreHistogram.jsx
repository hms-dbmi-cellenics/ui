import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateDoubletScoreHistogram';

import { loadPlotConfig } from '../../redux/actions/componentConfig';

const DoubletScoreHistogram = (props) => {
  const { experimentId, config, plotData } = props;
  const plotUuid = 'doubletScoreHistogram';
  const plotType = 'doubletScoreHistogram';

  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState(config);
  const plotComponent = useSelector((state) => state.componentConfig.doubletScoreHistogram);

  useEffect(() => {
    if (config && plotData) {
      setPlotSpec(generateSpec(config, plotData));
    }
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

DoubletScoreHistogram.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
};

DoubletScoreHistogram.defaultProps = {
  plotData: null,
};

export default DoubletScoreHistogram;
