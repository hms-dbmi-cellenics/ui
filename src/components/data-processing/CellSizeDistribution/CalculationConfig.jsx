import React from 'react';
import PropTypes from 'prop-types';
import {
  InputNumber,
  Form,
  Space,
  Tooltip,
} from 'antd';

import {
  InfoCircleOutlined,
} from '@ant-design/icons';
import BandwidthOrBinstep from '../ReadAlignment/PlotStyleMisc';

const CellSizeDistributionConfig = (props) => {
  const filtering = false;
  const {
    config, disabled, plotType, updateSettings,
  } = props;
  return (
    <>

      <Form.Item disabled label='Minimum #UMIs per cell'>
        <Space>
          <Tooltip title='The cut-off is automatically calculated as the inflection point of the knee plot. The inflection point estimates the boundary between empty drops and droplets that contain cells. The number of UMIs per cell varies depending on cell type. The typical minimum threshold range approx. 500-2000.'>
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={config.minCellSize}
            collapsible={!filtering ? 'disabled' : 'header'}
            onChange={(value) => updateSettings({ minCellSize: value })}
            onPressEnter={(e) => updateSettings({ minCellSize: e.target.value })}
            placeholder={10800}
            step={100}
          />
        </Space>
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
