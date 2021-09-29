import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { discardChangedQCFilters } from '../../redux/actions/experimentSettings';
import { runPipeline } from '../../redux/actions/pipeline';

import ChangesNotAppliedModal from '../ChangesNotAppliedModal';

const DataProcessingIntercept = (props) => {
  const {
    experimentId, onContinueNavigation, onCancelNavigation, onDismissIntercept,
  } = props;

  const changedQCFilters = useSelector(
    (state) => state.experimentSettings.processing.meta.changedQCFilters,
  );

  console.log('*** inside', experimentId);

  const dispatch = useDispatch();

  if (changedQCFilters.size > 0) {
    return (
      <ChangesNotAppliedModal
        experimentId={experimentId}
        onRunPipeline={() => {
          if (!experimentId) return;
          dispatch(runPipeline(experimentId));
          onCancelNavigation();
          onDismissIntercept();
        }}
        onDiscardChanges={() => {
          dispatch(discardChangedQCFilters());
          onDismissIntercept();
          onContinueNavigation();
        }}
        onCloseModal={() => {
          onDismissIntercept();
        }}
      />
    );
  }

  return <></>;
};

DataProcessingIntercept.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onContinueNavigation: PropTypes.func.isRequired,
  onCancelNavigation: PropTypes.func.isRequired,
  onDismissIntercept: PropTypes.func.isRequired,
};

export default DataProcessingIntercept;
