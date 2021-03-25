import React from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Slider,
  Form,
} from 'antd';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

const { Option } = Select;

const MitochondrialConfig = (props) => {
  const {
    config, disabled, plotType, updateSettings,
  } = props;

  const updateSettingsForActiveMethod = (diff) => {
    const realDiff = { methodSettings: { [activeMethod]: diff } };
    updateSettings(realDiff);
  };
  const filtering = false;

  const activeMethod = config.method;

  return (
    <>
      <Form.Item label='Method:'>
        <Select
          value={activeMethod}
          style={{ width: 200 }}
          collapsible={!filtering ? 'disabled' : 'header'}
          disabled={disabled}
        >
          <Option value='absolute_threshold'>Absolute threshold</Option>
          <Option value='option2'>option2</Option>
          <Option value='option3'>option3</Option>
        </Select>
      </Form.Item>
      <Form.Item label='Max percentage:'>
        <Slider
          value={config.methodSettings[activeMethod].maxFraction}
          min={0}
          max={100}
          step={0.05}
          collapsible={!filtering ? 'disabled' : 'header'}
          onChange={(val) => updateSettingsForActiveMethod({ maxFraction: val })}
          disabled={disabled}
        />
      </Form.Item>
      <BandwidthOrBinstep
        config={config.methodSettings[activeMethod]}
        onUpdate={updateSettingsForActiveMethod}
        type={plotType}
        min={0.1}
        max={10}
        disabled={disabled}
      />
    </>
  );
};

MitochondrialConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  plotType: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default MitochondrialConfig;
