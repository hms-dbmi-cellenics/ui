import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider,
  Form,
} from 'antd';

import hash from 'object-hash';
import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

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
      <Form.Item label='Max percentage'>
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

export default React.memo(
  MitochondrialConfig,
  (prevProps, nextProps) => hash(prevProps) === hash(nextProps),
);
