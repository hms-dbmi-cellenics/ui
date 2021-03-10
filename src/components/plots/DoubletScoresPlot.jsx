import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import generateSpec from '../../utils/plotSpecs/generateDoubletScoresSpec';

import Loader from '../Loader';

const DoubletScoresPlot = (props) => {
  const { experimentId, config, data } = props;

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (data) {
      setPlotSpec(generateSpec(config, data));
    }
  }, [data]);

  const render = () => {
    if (!data) {
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

DoubletScoresPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  data: PropTypes.array,
};

DoubletScoresPlot.defaultProps = {
  data: null,
};

export default DoubletScoresPlot;
