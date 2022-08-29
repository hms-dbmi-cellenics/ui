import React from 'react';
import PropTypes from 'prop-types';
import {
  Space,
  InputNumber,
  Form,
  Tooltip,
  Select,
  Slider,
  Alert,
  Radio,
  Button,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const { Option } = Select;

const GenesVsUMIsConfig = (props) => {
  const {
    config, updateSettings, disabled, rerunRequired, onQCRunClick,
  } = props;

  const [newConfig, handleChange] = useUpdateThrottled(updateSettings, config);

  const defaultPredictionInterval = 1 - config.regressionTypeSettings[config.regressionType]['p.level'];

  const getPLevelValue = () => {
    if (!config.predictionInterval && config.predictionInterval !== 0) {
      return config.regressionTypeSettings[config.regressionType]['p.level'];
    }
    return parseFloat(1 - config.predictionInterval).toFixed(6);
  };

  return (
    <>
      {/* only display info message for datasets which have
      not rerun the pipeline to see the new interractive plot */}
      {rerunRequired && (
        <Space direction='vertical'>
          <Alert
            message='A new interactive version of this plot is available! To see it,
      you need to run data processing again by clicking on the button below.
      Please note that by doing so, any customisation made to your project will be lost.
      In this case, we suggest creating a new project with the same data to view the new interactive plot.'
            type='info'
            showIcon
          />
          <Button
            type='primary'
            onClick={() => onQCRunClick()}
          >
            Re-run
          </Button>
        </Space>
      )}

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
        >
          <Option value='linear'>linear</Option>
          <Option value='spline'>spline</Option>
        </Select>
      </Form.Item>
      <Form.Item label='Prediction interval'>

        <Tooltip title=' Regression of feature counts (genes) vs UMI counts (molecules) is performed for all cells in order to detect outliers.
            The ‘prediction interval’ is the stringency for defining outliers: it sets the prediction intervals calculated by the R `predict`
            where `level = prediction interval`. Prediction intervals represent the likelihood that the predicted value will be between the upper and
            lower limits of the prediction interval. Prediction intervals are similar to confidence intervals, but on top of the sampling uncertainty,
            they also express uncertainty around a single value. They must account for the uncertainty in estimating the population mean,
            plus the random variation of the individual values. Higher prediction interval means higher probability of the value to be inside the range.
            Consequently, the size of the interval will be wider. The higher the prediction level, the less stringent we are when filtering the cells.
            Conversely, the lower the prediction level, the more stringent we are, and we exclude more cells that are far from the behaviour of the
            relationship between the number of genes and the number of UMIs/molecules.'
        >
          <InfoCircleOutlined />
        </Tooltip>

        <Slider
          value={newConfig.predictionInterval}
          min={0}
          max={0.99}
          step={0.01}
          disabled={disabled}
          onChange={(val) => handleChange({ predictionInterval: val })}
        />

        <Radio.Group
          value={config.predictionInterval}
          onChange={(val) => updateSettings({ predictionInterval: val.target.value })}
          disabled={disabled}
        >
          <Space direction='vertical'>
            <Space direction='horizontal'>
              <InputNumber
                value={newConfig.predictionInterval || defaultPredictionInterval}
                min={0}
                max={0.999999}
                disabled
                step={0.01}
              />
            </Space>
            <Radio value={0.999}>0.999</Radio>
            <Radio value={0.9999}>0.9999</Radio>
            <Radio value={0.99999}>0.99999</Radio>
            <Radio value={0.999999}>0.999999</Radio>
          </Space>
        </Radio.Group>

      </Form.Item>
      <Form.Item label='p-value:'>
        <Space direction='horizontal'>
          <Tooltip title='The reported p-value is derived from the prediction interval: p-value = 1 - prediction interval.'>
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={getPLevelValue()}
            disabled
          />
        </Space>
      </Form.Item>
    </>
  );
};

GenesVsUMIsConfig.propTypes = {
  updateSettings: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired,
  rerunRequired: PropTypes.bool.isRequired,
  onQCRunClick: PropTypes.func.isRequired,
};

export default GenesVsUMIsConfig;
