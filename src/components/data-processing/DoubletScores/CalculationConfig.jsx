import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider,
  Form,
} from 'antd';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

const DoubletScoresConfig = (props) => {
  const {
    config, disabled, plotType, updateSettings,
  } = props;

  const filtering = false;

  return (
    <>
      <Form.Item label='Probability threshold'>
        <Slider
          collapsible={!filtering ? 'disabled' : 'header'}
          value={config.probabilityThreshold}
          min={0}
          max={1}
          onChange={(val) => updateSettings({ probabilityThreshold: val })}
          step={0.05}
          disabled={disabled}
        />
      </Form.Item>
      <BandwidthOrBinstep
        config={config}
        onUpdate={updateSettings}
        type={plotType}
        max={0.5}
        min={0.001}
        disabled={disabled}
      />
    </>
  );
};

DoubletScoresConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  plotType: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default React.memo(
  DoubletScoresConfig,
  (prev, next) => prev.config.probabilityThreshold === next.config.probabilityThreshold && prev.disabled === next.disabled,
);
