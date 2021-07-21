import React from 'react';
import PropTypes from 'prop-types';

const StepsIndicator = (props) => {
  const { allSteps, completedSteps, currentStep } = props;
  const colors = {
    notCompleted: '#d9d9d9', // gray
    currentStep: '#ff6f00', // orange
    completed: '#009930', // blue
  };
  return (
    <div
      role='progressbar'
      aria-valuemin='0'
      aria-valuemax={allSteps.length}
      aria-valuenow={completedSteps}
    >
      {allSteps.map((step, index) => {
        let color = colors.completed;
        if (index === currentStep) {
          color = colors.currentStep;
        } else if (index > completedSteps - 1) {
          color = colors.notCompleted;
        }
        return (
          <svg width='18' height='10'>
            <rect width='16' height='8' style={{ fill: color }} />
          </svg>
        );
      })}
    </div>
  );
};

StepsIndicator.propTypes = {
  allSteps: PropTypes.array.isRequired,
  completedSteps: PropTypes.number.isRequired,
  currentStep: PropTypes.number.isRequired,
};
export default StepsIndicator;
