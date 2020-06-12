import React, { useState } from 'react';
import {
  useDispatch,
} from 'react-redux';
import DiffExprCompute from './DiffExprCompute';
import DiffExprResults from './DiffExprResults';
import { loadDiffExpr } from '../../../../redux/actions';

const DiffExprManager = (props) => {
  const { experimentID, view } = props;

  const defaultSelected = { key: 'default', value: 'select cluster' };

  const [currentView, setCurrentView] = useState(view);
  const [firstSelectedCluster, setFirstSelectedCluster] = useState(defaultSelected);
  const [secondSelectedCluster, setSecondSelectedCluster] = useState(defaultSelected);
  const [comparisonType, setComparisonType] = useState(null);

  const dispatch = useDispatch();

  const onCompute = (comparison, first, second) => {
    if (comparison !== comparisonType
      || first.key !== firstSelectedCluster.key
      || second.key !== secondSelectedCluster.key) {
      dispatch(
        loadDiffExpr(experimentID, comparison, first, second),
      );
    }
    setCurrentView('results');
    setFirstSelectedCluster(first);
    setSecondSelectedCluster(second);
    setComparisonType(comparison);
  };

  const onGoBack = () => {
    setCurrentView('compute');
  };

  if (currentView === 'compute') {
    return (
      <DiffExprCompute
        experimentID={experimentID}
        onCompute={onCompute}
        first={firstSelectedCluster}
        second={secondSelectedCluster}
        comparison={comparisonType}
      />
    );
  }
  if (currentView === 'results') {
    return <DiffExprResults onGoBack={onGoBack} />;
  }
};

export default DiffExprManager;
