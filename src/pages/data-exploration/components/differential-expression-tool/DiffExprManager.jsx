import React, { useState } from 'react';
import {
  useDispatch,
} from 'react-redux';
import _ from 'lodash';
import DiffExprCompute from './DiffExprCompute';
import DiffExprResults from './DiffExprResults';
import { loadDifferentialExpression } from '../../../../redux/actions/differentialExpression';

const DiffExprManager = (props) => {
  const { experimentId, view } = props;

  const defaultSelected = 'Select a cell set';
  const [selectedCellSets, setSelectedCellSets] = useState({
    first: defaultSelected,
    second: defaultSelected,
  });

  const [currentView, setCurrentView] = useState(view);
  const [comparisonType, setComparisonType] = useState(null);

  const dispatch = useDispatch();

  const onCompute = (comparison, selection) => {
    if (comparison !== comparisonType
      || !_.isEqual(selection, selectedCellSets)) {
      dispatch(
        loadDifferentialExpression(experimentId, comparison, selection),
      );

      setSelectedCellSets(selection);
    }

    setCurrentView('results');
    setComparisonType(comparison);
  };

  const onGoBack = () => {
    setCurrentView('compute');
  };

  if (currentView === 'compute') {
    return (
      <DiffExprCompute
        experimentId={experimentId}
        onCompute={onCompute}
        selection={selectedCellSets}
        comparison={comparisonType}
      />
    );
  }
  if (currentView === 'results') {
    return <DiffExprResults onGoBack={onGoBack} />;
  }
};

export default DiffExprManager;
