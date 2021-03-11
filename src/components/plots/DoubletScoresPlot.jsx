import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateDoubletScoresSpec';
import { loadPlotConfig } from '../../redux/actions/componentConfig';

const DoubletScoresPlot = (props) => {
  const { experimentId, config, plotData } = props;
  const plotUuid = 'embeddingPreviewDoubletScore';
  const plotType = 'embeddingPreviewDoubletScore';

  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState({});
  const doubletScore = useSelector((state) => state.componentConfig.embeddingPreviewDoubletScore);

  useEffect(() => {
    if (plotData) {
      setPlotSpec(generateSpec(config, plotData));
    }
  }, [plotData]);

  const render = () => {
    if (!doubletScore) {
      return (
        <PlatformError
          description='Failed loading plot data'
          onClick={() => { dispatch(loadPlotConfig(experimentId, plotUuid, plotType)); }}
        />
      );
    }

    if (!plotData.length) {
      return (
        <center>
          <PlatformError
            description='There is no data to show. Please run the pipeline again.'
            // TODO : Run the pipeline again
            onClick={() => { }}
          />
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

DoubletScoresPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
};

DoubletScoresPlot.defaultProps = {
  plotData: null,
};

export default DoubletScoresPlot;
