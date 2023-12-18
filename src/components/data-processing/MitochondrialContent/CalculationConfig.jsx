import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
} from 'antd';

import SliderWithInput from '../../SliderWithInput';

const CalculationConfig = (props) => {
  const {
    config, disabled, plotType, updateSettings,
  } = props;

  const updateSettingsForActiveMethod = (diff) => {
    // This is a temporary measure to account for the fact that
    // the pipeline is using fractions instead of percentages
    const newDiff = { ...diff };
    if (newDiff.maxFraction) {
      newDiff.maxFraction /= 100;
    }

    const realDiff = { methodSettings: { [activeMethod]: newDiff } };
    updateSettings(realDiff);
  };

  const activeMethod = config.method;
  const activeMethodSettings = config.methodSettings[activeMethod];

  return (
    <>
      <Form.Item label='Max percentage'>
        <SliderWithInput
          min={0}
          max={100}
          step={2}
          value={(activeMethodSettings.maxFraction * 100).toFixed(2)}
          onUpdate={(newValue) => updateSettingsForActiveMethod({ maxFraction: newValue })}
          disabled={disabled}
        />
      </Form.Item>
      <Form.Item label='Bin step'>
        <SliderWithInput
          min={0.1}
          max={10}
          value={config.methodSettings[activeMethod].binStep}
          onUpdate={(newValue) => updateSettingsForActiveMethod({ binStep: newValue })}
          disabled={disabled || plotType === 'logHistogram'}
        />
      </Form.Item>
    </>
  );
};
CalculationConfig.defaultProps = {
  updateSettings: () => {},
  config: {},
  disabled: false,
};
CalculationConfig.propTypes = {
  updateSettings: PropTypes.func,
  config: PropTypes.object,
  plotType: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default CalculationConfig;
