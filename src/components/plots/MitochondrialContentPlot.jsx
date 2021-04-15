import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { Skeleton } from 'antd';

import PlatformError from '../PlatformError';
import { generateSpec } from '../../utils/plotSpecs/generateMitochondrialContentSpec';
import loadCellMeta from '../../redux/actions/cellMeta';

const MitochondrialContentPlot = (props) => {
  const {
    experimentId, config, plotData, actions,
  } = props;
  const dataName = 'mitochondrialContent';

  const dispatch = useDispatch();

  const mitochondrialContent = useSelector((state) => state.cellMeta?.mitochondrialContent);

  const [plotSpec, setPlotSpec] = useState({});
  const plotComponent = useSelector((state) => state.componentConfig.embeddingPreviewMitochondrialContent);

  useEffect(() => {
    if (plotData.length) {
      setPlotSpec(generateSpec(config, plotData));
    }
  }, [plotData]);

  const render = () => {
    if (!plotData.length && mitochondrialContent.error) {
      return (
        <PlatformError
          description={mitochondrialContent?.error}
          onClick={() => { dispatch(loadCellMeta(experimentId, dataName)); }}
        />
      );
    }

    if (!plotData.length && (
      mitochondrialContent?.loading
      || !plotComponent
    )) {
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

MitochondrialContentPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

MitochondrialContentPlot.defaultProps = {
  plotData: null,
  actions: true,
};

export default MitochondrialContentPlot;
