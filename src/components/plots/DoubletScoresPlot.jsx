import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { Skeleton } from 'antd';
import PlatformError from '../PlatformError';
import { generateSpec } from '../../utils/plotSpecs/generateDoubletScoresSpec';
import loadCellMeta from '../../redux/actions/cellMeta';

const DoubletScoresPlot = (props) => {
  const {
    experimentId, config, plotData, actions,
  } = props;
  const dataName = 'doubletScores';

  const dispatch = useDispatch();

  const doubletScores = useSelector((state) => state.cellMeta?.doubletScores);

  const [plotSpec, setPlotSpec] = useState({});
  const plotComponent = useSelector((state) => state.componentConfig.embeddingPreviewDoubletScore);

  useEffect(() => {
    if (plotData.length) {
      setPlotSpec(generateSpec(config, plotData));
    }
  }, [plotData]);

  const render = () => {
    if (!plotData.length) {
      return (
        <PlatformError
          description={doubletScores?.error}
          onClick={() => { dispatch(loadCellMeta(experimentId, dataName)); }}
        />
      );
    }

    if (!plotData.length
      && (doubletScores?.loading
        || !plotComponent)
    ) {
      return (
        <center>
          <Skeleton.Image style={{ width: 400, height: 400 }} />
        </center>
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

DoubletScoresPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

DoubletScoresPlot.defaultProps = {
  plotData: null,
  actions: true,
};

export default DoubletScoresPlot;
