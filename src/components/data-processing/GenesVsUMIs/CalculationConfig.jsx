import React from 'react';
import PropTypes from 'prop-types';
import {
  Space,
  InputNumber,
  Form,
  Tooltip,
  Select,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const GenesVsUMIsConfig = (props) => {
  const {
    // eslint-disable-next-line no-unused-vars
    config, disabled, plotType, updateSettings,
  } = props;

  return (
    <>
      <Form.Item label={(
        <span>
          Fit type&nbsp;
          <Tooltip overlay={(
            <span>
              A linear fit works well for most samples and is performed with `MASS::rlm`.
              A spline fit is useful to prevent excluding samples that show a natural saturation
              in the gene counts at high molecule counts and is performed with `splines::bs`.
            </span>
          )}
          >
            <InfoCircleOutlined />
          </Tooltip>
        </span>
      )}
      >
        <Select
          value={config.regressionType}
          onChange={(val) => updateSettings({ regressionType: val })}
          disabled={disabled}
        >
          <Option value='linear'>linear</Option>
          <Option value='spline'>spline</Option>
        </Select>
      </Form.Item>
      <Form.Item label='p-level cut-off:'>
        <Space direction='horizontal'>
          <Tooltip title='Regression of feature counts (genes) vs UMI counts (molecules) is performed for all cells in order to detect outliers. The ‘p-level cut-off’ is the stringency for defining outliers: ‘p.level’ refers to the confidence level for a given cell to deviate from the main trend. The smaller the number the more stringent cut-off.
‘p.level’ sets the prediction intervals calculated by the R `predict` where `level = 1 - p.value`.'
          >
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={config.regressionTypeSettings[config.regressionType]['p.level']}
            onChange={(value) => updateSettings({ regressionTypeSettings: { [config.regressionType]: { 'p.level': value } } })}
            onPressEnter={(e) => updateSettings({ regressionTypeSettings: { [config.regressionType]: { 'p.level': e.target.value } } })}
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
  plotType: PropTypes.string,
  updateSettings: PropTypes.func,
  config: PropTypes.object,
  disabled: PropTypes.bool,
};
GenesVsUMIsConfig.defaultProps = {
  plotType: 'overriden by CalculationConfigContainer, like the rest of props here',
  updateSettings: () => { },
  config: {},
  disabled: false,
};

export default GenesVsUMIsConfig;
