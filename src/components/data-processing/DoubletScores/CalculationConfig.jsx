import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';

import SliderWithInput from '../../SliderWithInput';

const DoubletScoresConfig = (props) => {
  const {
    config, disabled, plotType, updateSettings,
  } = props;

  const filtering = false;

  console.log('configBinStepDebug');
  console.log(config.binStep);

  return (
    <>
      <Form.Item label='Probability threshold'>
        <SliderWithInput
          min={0}
          max={1}
          step={0.05}
          value={config.probabilityThreshold}
          propertyToUpdate='probabilityThreshold'
          onUpdate={(newValue) => updateSettings({ probabilityThreshold: newValue })}
          disabled={disabled}
        />
      </Form.Item>
      <Form.Item label='Bin step'>
        <SliderWithInput
          min={0.001}
          max={0.5}
          value={config.binStep}
          propertyToUpdate='binStep'
          onUpdate={(newValue) => updateSettings({ binStep: newValue })}
          disabled={disabled}
        />
      </Form.Item>
    </>
  );
};

DoubletScoresConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  plotType: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default DoubletScoresConfig;
