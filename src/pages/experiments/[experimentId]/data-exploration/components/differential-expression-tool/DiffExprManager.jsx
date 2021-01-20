import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import DiffExprCompute from './DiffExprCompute';
import DiffExprResults from './DiffExprResults';

const DiffExprView = {
  results: 'results',
  compute: 'compute',
};

const DiffExprManager = (props) => {
  const {
    experimentId, view, width, height,
  } = props;

  const comparisonGroup = useSelector((state) => state.differentialExpression.comparison.group);
  const comparisonType = useSelector((state) => state.differentialExpression.comparison.type);

  const [currentView, setCurrentView] = useState(view);

  const onCompute = () => {
    setCurrentView(DiffExprView.results);
  };

  const onGoBack = () => {
    setCurrentView(DiffExprView.compute);
  };

  if (currentView === DiffExprView.compute) {
    return (
      <DiffExprCompute
        experimentId={experimentId}
        onCompute={onCompute}
        cellSets={comparisonGroup}
      />
    );
  }
  if (currentView === DiffExprView.results) {
    return (
      <DiffExprResults
        onGoBack={onGoBack}
        cellSets={{
          cellSet: comparisonGroup[comparisonType].cellSet.split('/')[1],
          compareWith: comparisonGroup[comparisonType].compareWith.split('/')[1],
          basis: comparisonGroup[comparisonType].basis.split('/')[1],
        }}
        experimentId={experimentId}
        width={width}
        height={height}
      />
    );
  }
};

DiffExprManager.defaultProps = {
  view: DiffExprView.compute,
};

DiffExprManager.propTypes = {
  experimentId: PropTypes.string.isRequired,
  view: PropTypes.string,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default DiffExprManager;
