import React from 'react';
import PropTypes from 'prop-types';

const StepsIndicator = (props) => {
  const { allSteps, completedSteps, currentStep } = props;
  let increment = 0;

  return (
    <>
      {allSteps.map((step) => {
        let color = '#1890ff';
        if (increment === currentStep) {
          color = '#cf1322';
        } else if (increment > completedSteps - 1) {
          color = '#d9d9d9';
        }
        increment += 1;
        return (
          <svg width='18' height='8'>
            <rect width='15' height='8' style={{ fill: color }} />
          </svg>
        );
      })}
    </>
  );
};

StepsIndicator.propTypes = {
  allSteps: PropTypes.array.isRequired,
  completedSteps: PropTypes.number.isRequired,
  currentStep: PropTypes.number.isRequired,
};
export default StepsIndicator;
