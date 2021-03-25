import React from 'react';
import PropTypes from 'prop-types';
import {
  InputNumber,
  Form,
} from 'antd';

import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

const CellSizeDistributionConfig = (props) => {
  const filtering = false;
  const {
    config, disabled, plotType, updateSettings,
  } = props;
  return (
    <>
      <Form.Item disabled label='Min cell size:'>
        <InputNumber
          value={config.minCellSize}
          collapsible={!filtering ? 'disabled' : 'header'}
          onChange={(value) => updateSettings({ minCellSize: value })}
          onPressEnter={(e) => updateSettings({ minCellSize: e.target.value })}
          placeholder={10800}
          step={100}
          disabled={disabled}
        />
      </Form.Item>
      <BandwidthOrBinstep
        config={config}
        onUpdate={updateSettings}
        type={plotType}
        max={400}
        disabled={disabled}
      />
    </>
  );
};
CellSizeDistributionConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  plotType: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default CellSizeDistributionConfig;
