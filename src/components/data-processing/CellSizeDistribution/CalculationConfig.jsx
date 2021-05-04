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
import SliderWithInput from '../../SliderWithInput';

const CellSizeDistributionConfig = (props) => {
  const {
    config, disabled, updateSettings, highestUmi,
  } = props;

  const withinRange = (cellSize) => Math.max(Math.min(cellSize, highestUmi ?? 17000), 0);

  return (
    <>

      <Form.Item disabled label='Minimum #UMIs per cell'>
        <Space>
          <Tooltip title='The cut-off is automatically calculated as the inflection point of the knee plot. The inflection point estimates the boundary between empty drops and droplets that contain cells. The number of UMIs per cell varies depending on cell type. The typical minimum threshold range approx. 500-2000.'>
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={config.minCellSize}
            onChange={(value) => {
              updateSettings({ minCellSize: withinRange(value) });
            }}
            onPressEnter={(e) => {
              updateSettings({ minCellSize: withinRange(e.target.value) });
            }}
            placeholder={10800}
            step={100}
            disabled={disabled}
            max={highestUmi ?? 17000}
            min={0}
          />
        </Space>
      </Form.Item>

      <Form.Item label='Bin step'>
        <SliderWithInput
          min={100}
          max={400}
          value={config.binStep}
          onUpdate={(value) => {
            updateSettings({ binStep: value });
          }}
          disabled={disabled}
        />
      </Form.Item>
    </>
  );
};
CellSizeDistributionConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired,
  highestUmi: PropTypes.number.isRequired,
};

export default CellSizeDistributionConfig;
