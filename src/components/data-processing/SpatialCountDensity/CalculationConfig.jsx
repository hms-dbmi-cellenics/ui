import React from 'react';
import PropTypes from 'prop-types';
import { Form, Switch, Typography } from 'antd';

import SliderWithInput from '../../SliderWithInput';

const { Text } = Typography;

// Settings for the Xenium count-density filter: how many MADs below the median
// log count density a cell is removed at, and whether cells whose control probe
// and codeword counts are above a maximum percent of their counts are removed too.
const CountDensityCalculationConfig = (props) => {
  const {
    config, disabled, updateSettings, threshold,
  } = props;

  return (
    <>
      <Form.Item label='MADs below median'>
        <SliderWithInput
          min={0}
          max={10}
          step={0.5}
          value={config.nmads}
          onUpdate={(newValue) => updateSettings({ nmads: newValue })}
          disabled={disabled}
        />
        {threshold !== null && (
          <div style={{ marginTop: 8 }}>
            <Text type='secondary' style={{ whiteSpace: 'nowrap' }}>
              {`Removes cells below ${Math.exp(threshold).toFixed(3)} counts/µm²`}
            </Text>
          </div>
        )}
      </Form.Item>
      <Form.Item label='Remove cells with high control counts'>
        <Switch
          checked={config.filterControls}
          onChange={(checked) => updateSettings({ filterControls: checked })}
          disabled={disabled}
        />
      </Form.Item>
      <Form.Item label='Max control % of counts'>
        <SliderWithInput
          min={0}
          max={50}
          step={0.5}
          value={config.maxControlPercent}
          onUpdate={(newValue) => updateSettings({ maxControlPercent: newValue })}
          disabled={disabled || !config.filterControls}
        />
      </Form.Item>
      <Form.Item label='Bin step'>
        <SliderWithInput
          min={0.01}
          max={0.5}
          step={0.01}
          value={config.binStep}
          onUpdate={(newValue) => updateSettings({ binStep: newValue })}
          disabled={disabled}
        />
      </Form.Item>
    </>
  );
};

CountDensityCalculationConfig.defaultProps = {
  updateSettings: () => {},
  config: {},
  disabled: false,
  threshold: null,
};

CountDensityCalculationConfig.propTypes = {
  updateSettings: PropTypes.func,
  config: PropTypes.object,
  disabled: PropTypes.bool,
  // log count-density threshold for the current nmads, when known
  threshold: PropTypes.number,
};

export default CountDensityCalculationConfig;
