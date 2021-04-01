import React from 'react';
import PropTypes from 'prop-types';
import {
  Space,
  InputNumber,
  Form,
  Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const GenesVsUMIsConfig = (props) => {
  const {
    // eslint-disable-next-line no-unused-vars
    config, disabled, plotType, updateSettings,
  } = props;

  return (
    <>
      <Form.Item
        label='Regression type:'
      />
      <Form.Item label='p-level cut-off:'>
        <Space direction='horizontal'>
          <Tooltip title='Linear regression (Gam) of UMIs vs features (genes) is performed for all cells in order to detect outliers. The ‘p-level cut-off’ is the stringency for defining outliers: ‘p.level’ refers to the confidence level for a given cell to deviate from the main trend. The smaller the number the more stringent cut-off.
‘p.level’ sets the prediction intervals calculated by the R `predict.lm` whereas `level = 1 - p.value`. The underlying regression is performed with `MASS::rlm`'
          >
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={config.regressionTypeSettings.gam['p.level']}
            onChange={(value) => updateSettings({ regressionTypeSettings: { gam: { 'p.level': value } } })}
            onPressEnter={(e) => updateSettings({ regressionTypeSettings: { gam: { 'p.level': e.target.value } } })}
            placeholder={0.00001}
            min={0}
            max={1}
            step={0.00001}
            disabled={disabled}
          />
        </Space>
      </Form.Item>
    </>
  );
};

GenesVsUMIsConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  plotType: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default GenesVsUMIsConfig;
