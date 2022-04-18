import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

import loadCellSets from 'redux/actions/cellSets/loadCellSets';
import { getCellSets } from 'redux/selectors';

import { generateSpec, generateData } from 'utils/plotSpecs/generateFrequencySpec';
import Loader from 'components/Loader';

const FrequencyPlot = (props) => {
  const {
    experimentId, config, actions, formatCSVData,
  } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector(getCellSets());

  const { hierarchy, properties } = cellSets;

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }
  }, []);

  useEffect(() => {
    if (!config || cellSets.loading || cellSets.error) { return; }

    const {
      xNamesToDisplay,
      yNamesToDisplay,
      plotData,
    } = generateData(hierarchy, properties, config);

    formatCSVData(plotData);
    setPlotSpec(generateSpec(config, plotData, xNamesToDisplay, yNamesToDisplay));
  }, [hierarchy, properties, config]);

  // If the plotSpec is empty then don't render it, this avoids a bug where
  //  vega doesn't remove the initial plot if it was created with an empty plotSpec
  if (Object.keys(plotSpec).length === 0) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  return (
    <center>
      <Vega spec={plotSpec} renderer='canvas' actions={actions} />
    </center>
  );
};

FrequencyPlot.propTypes = {
  config: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  experimentId: PropTypes.string.isRequired,
  formatCSVData: PropTypes.func,
};

FrequencyPlot.defaultProps = {
  actions: true,
  formatCSVData: () => { },
};

export default FrequencyPlot;
