import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  InputNumber,
  Tooltip,
  Space,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const ClassifierConfig = (props) => {
  const {
    // eslint-disable-next-line no-unused-vars
    config, disabled, updateSettings, plotType,
  } = props;

  return (
    <>
      <Form.Item label='FDR:'>
        <Space direction='horizontal'>
          <Tooltip title='False discovery rate (FDR) is calculated for each barcode by using the ‘emptyDrops’ function (https://rdrr.io/github/MarioniLab/DropletUtils/man/emptyDrops.html). This distinguishes between droplets containing cells and ambient RNA. The FDR range is [0-1]. The default FDR value is 0.01, where only barcodes with FDR < 0.01 are retained.'>
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={config.FDR}
            onChange={(value) => updateSettings({ FDR: value })}
            onPressEnter={(e) => updateSettings({ FDR: e.target.value })}
            placeholder={0.01}
            min={0}
            max={1}
            step={0.01}
            disabled={disabled}
          />
        </Space>
      </Form.Item>
    </>
  );
};

ClassifierConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  plotType: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default ClassifierConfig;
