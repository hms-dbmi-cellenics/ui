import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { loadCellSets } from 'redux/actions/cellSets';
import { generateSpec, generateData } from 'utils/plotSpecs/generateViolinSpec';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';

const ViolinFilterPlot = (props) => {
  const {
    config, data, experimentId, loading, error, reloadPlotData, actions,
  } = props;
  const dispatch = useDispatch();
  const cellSets = useSelector((state) => state.cellSets);

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (config && data) {
      const generatedPlotData = generateData(
        cellSets,
        data,
        'sample',
        'All',
      );
      setPlotSpec(generateSpec(config, generatedPlotData));
    }
  }, [config, data]);

  if (error) {
    return (
      <PlatformError
        error={error}
        onClick={() => { reloadPlotData(); }}
      />
    );
  }

  if (cellSets.error) {
    return (
      <PlatformError
        error={cellSets.error}
        onClick={() => { dispatch(loadCellSets(experimentId)); }}
      />
    );
  }

  if (!config
    || loading
    || cellSets.loading
    || Object.keys(plotSpec).length === 0) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  return (
    <center>
      <Vega spec={plotSpec} renderer='webgl' actions={actions} />
    </center>
  );
};

ViolinFilterPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  reloadPlotData: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  actions: PropTypes.object.isRequired,
  data: PropTypes.array.isRequired,
  config: PropTypes.object.isRequired,
};

export default ViolinFilterPlot;
