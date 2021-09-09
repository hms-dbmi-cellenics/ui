import React from 'react';
import PropTypes from 'prop-types';
import integrationtestConstants from '../../utils/integrationTestConstants';

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
        let dataTestClass = integrationtestConstants.classes.QC_STEP_COMPLETED;
        if (index === currentStep) {
          color = colors.currentStep;
        } else if (index > completedSteps - 1) {
          color = colors.notCompleted;
          dataTestClass = integrationtestConstants.classes.QC_STEP_NOT_COMPLETED;
        }
        return (
          <svg width='18' height='10' data-test-class={dataTestClass}>
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
