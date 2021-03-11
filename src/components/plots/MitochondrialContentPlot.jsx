import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateMitochondrialContentSpec';
import { loadPlotConfig } from '../../redux/actions/componentConfig';

import Loader from '../Loader';

const MitochondrialContentPlot = (props) => {
  const { experimentId, config, plotData } = props;
  const plotUuid = 'embeddingPreviewMitochondrialContent';
  const plotType = 'embeddingPreviewMitochondrialContent';

  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState({});
  const mitochondrialContent = useSelector((state) => state.componentConfig.embeddingPreviewMitochondrialContent);

  useEffect(() => {
    if (plotData) {
      setPlotSpec(generateSpec(config, plotData));
    }
  }, [plotData]);

  const render = () => {
    if (!mitochondrialContent) {
      return (
        <PlatformError
          description='Failed loading plot data'
          onClick={() => { dispatch(loadPlotConfig(experimentId, plotUuid, plotType)); }}
        />
      );
    }

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
