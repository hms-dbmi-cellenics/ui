import React, { useState } from 'react';
import _ from 'lodash';
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

  const [selectedGroups, setSelectedGroups] = useState({
    cellSet: null,
    compareWith: null,
    basis: null,
  });

  const [diffExprType, setDiffExprType] = useState(null);

  const [currentView, setCurrentView] = useState(view);

  const onCompute = (type, newSelectedCellSets) => {
    if (!_.isEqual(newSelectedCellSets, selectedGroups)) {
      setSelectedGroups(newSelectedCellSets);
    }

    setDiffExprType(type);

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
        cellSets={selectedGroups}
        diffExprType={diffExprType}
      />
    );
  }
  if (currentView === DiffExprView.results) {
    return (
      <DiffExprResults
        onGoBack={onGoBack}
        cellSets={{
          cellSet: selectedGroups.cellSet.split('/')[1],
          compareWith: selectedGroups.compareWith.split('/')[1] || selectedGroups.compareWith,
          basis: selectedGroups.basis.split('/')[1] || selectedGroups.basis,
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
