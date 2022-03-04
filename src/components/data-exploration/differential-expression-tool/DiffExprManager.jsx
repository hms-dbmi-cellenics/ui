import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DiffExprCompute from 'components/data-exploration/differential-expression-tool/DiffExprCompute';
import DiffExprResults from 'components/data-exploration/differential-expression-tool/DiffExprResults';

const DiffExprView = {
  RESULTS: 'results',
  COMPUTE: 'compute',
};

const DiffExprManager = (props) => {
  const {
    experimentId, view, width, height,
  } = props;

  const [currentView, setCurrentView] = useState(view);

  const onCompute = () => {
    setCurrentView(DiffExprView.RESULTS);
  };

  const onGoBack = () => {
    setCurrentView(DiffExprView.COMPUTE);
  };

  if (currentView === DiffExprView.COMPUTE) {
    return (
      <DiffExprCompute
        experimentId={experimentId}
        onCompute={onCompute}
      />
    );
  }
  if (currentView === DiffExprView.RESULTS) {
    return (
      <DiffExprResults
        onGoBack={onGoBack}
        experimentId={experimentId}
        width={width}
        height={height}
      />
    );
  }
};

DiffExprManager.defaultProps = {
  view: DiffExprView.COMPUTE,
};

DiffExprManager.propTypes = {
  experimentId: PropTypes.string.isRequired,
  view: PropTypes.string,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default DiffExprManager;
