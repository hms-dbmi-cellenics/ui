import React from 'react';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

const VegaWrapper = (props) => {
  const {
    spec,
    renderer,
    actions,
    signalListeners,
  } = props;

  return (
    <Vega
      spec={spec}
      renderer={renderer}
      actions={actions}
      signalListeners={signalListeners}
    />
  );
};

VegaWrapper.propTypes = {
  spec: PropTypes.object.isRequired,
  renderer: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  signalListeners: PropTypes.object.isRequired,
};

export default VegaWrapper;
