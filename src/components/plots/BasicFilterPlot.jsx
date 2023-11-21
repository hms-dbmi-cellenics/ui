import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import EmptyPlot from 'components/plots/helpers/EmptyPlot';

const BasicFilterPlot = (props) => {
  const {
    spec, actions, miniPlot,
  } = props;

  const dataAvailable = spec?.data[0].values.length;
  if (!dataAvailable) {
    return (
      <EmptyPlot mini={miniPlot} />
    );
  }
  return (
    <center data-testid='vega-container'>
      <Vega spec={spec} renderer='canvas' actions={actions} />
    </center>
  );
};

BasicFilterPlot.propTypes = {
  spec: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  miniPlot: PropTypes.bool,
};

BasicFilterPlot.defaultProps = {
  actions: true,
  miniPlot: false,
};

export default BasicFilterPlot;
