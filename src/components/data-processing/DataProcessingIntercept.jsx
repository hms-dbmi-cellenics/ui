import React from 'react';
import PropTypes from 'prop-types';

import ChangesNotAppliedModal from 'components/data-processing/ChangesNotAppliedModal';

const DataProcessingIntercept = (props) => {
  const {
    onContinueNavigation, onCancelNavigation, onDismissIntercept,
  } = props;

  return (
    <ChangesNotAppliedModal
      onRunQC={() => {
        onCancelNavigation();
        onDismissIntercept();
      }}
      onDiscardChanges={() => {
        onDismissIntercept();
        onContinueNavigation();
      }}
      onCloseModal={() => {
        onDismissIntercept();
      }}
    />
  );
};

DataProcessingIntercept.propTypes = {
  onContinueNavigation: PropTypes.func,
  onCancelNavigation: PropTypes.func,
  onDismissIntercept: PropTypes.func,
};

DataProcessingIntercept.defaultProps = {
  onContinueNavigation: () => { },
  onCancelNavigation: () => { },
  onDismissIntercept: () => { },
};

export default DataProcessingIntercept;
