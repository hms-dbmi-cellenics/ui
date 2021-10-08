import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

import loadCellSets from '../../redux/actions/cellSets/loadCellSets';

import { generateSpec, generateData } from '../../utils/plotSpecs/generateFrequencySpec';

const FrequencyPlot = (props) => {
  const {
    experimentId, config, actions,
  } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const [plotSpec, setPlotSpec] = useState({});

  const {
    hierarchy, properties,
  } = cellSets;

  useEffect(() => {
    if (!hierarchy && !properties) {
      dispatch(loadCellSets(experimentId));
    }
  }, []);

  useEffect(() => {
    if (hierarchy && properties && config) {
      setPlotSpec(generateSpec(config, generateData(hierarchy, properties, config)));
    }
  }, [hierarchy, properties, config]);

  return (
    <center>
      <Vega spec={plotSpec} renderer='canvas' actions={actions} />
    </center>
  );
};

FrequencyPlot.propTypes = {
  config: PropTypes.object.isRequired,
  experimentId: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

FrequencyPlot.defaultProps = {
  actions: true,
};

export default FrequencyPlot;
