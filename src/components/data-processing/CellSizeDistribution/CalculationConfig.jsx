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

const MIN_CELL_SIZE_PLACEHOLDER = 10800;

const CellSizeDistributionConfig = (props) => {
  const {
    config, disabled, updateSettings, highestUmi, plotType,
  } = props;

  const withinRange = (cellSize) => Math.max(Math.min(cellSize, highestUmi), 0);

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
            placeholder={MIN_CELL_SIZE_PLACEHOLDER}
            step={100}
            disabled={disabled}
            max={highestUmi}
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
          disabled={disabled || plotType === 'kneePlot'}
        />
      </Form.Item>
    </>
  );
};
CellSizeDistributionConfig.defaultProps = {
  updateSettings: () => {},
  config: {},
  disabled: false,
  highestUmi: null,
  plotType: null,
};
CellSizeDistributionConfig.propTypes = {
  updateSettings: PropTypes.func,
  config: PropTypes.object,
  disabled: PropTypes.bool,
  highestUmi: PropTypes.number,
  plotType: PropTypes.string,
};

export default CellSizeDistributionConfig;
