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
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';
import { range } from 'lodash';

const { Option } = Select;

const GenesVsUMIsConfig = (props) => {
  const {
    config, updateSettings,
  } = props;
  const [newConfig, handleChange] = useUpdateThrottled(updateSettings, config);

  const defaultValues = range(0, 0.99, 0.01);
  console.log('defaultValues', defaultValues);
  const sliderMarks = {
    ...defaultValues,
    0.999: '0.999',
    0.9999: {
      style: {
        transform: 'translate(10%)',
      },
      label: '0.9999',
    },

    0.99999: '0.99999',
    0.999999: '0.999999',
  };
  console.log('CONFIG IS ', config);
  return (
    <>
      {/* only display info message for datasets which have not rerun the pipeline to see the new interractive plot */}

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
        <Slider
          value={newConfig.predictionInterval}
          min={0}
          max={0.999999}
          marks={sliderMarks}
          step={null}
          onChange={(val) => handleChange({ predictionInterval: val })}
        />
      </Form.Item>
      <Form.Item label='p-value:'>
        <Space direction='horizontal'>
          <Tooltip title='Regression of feature counts (genes) vs UMI counts (molecules) is performed for all cells in order to detect outliers. The ‘p-level cut-off’ is the stringency for defining outliers: ‘p.level’ refers to the confidence level for a given cell to deviate from the main trend. The smaller the number the more stringent cut-off.
‘p.level’ sets the prediction intervals calculated by the R `predict` where `level = 1 - p.value`.'
          >
            <InfoCircleOutlined />
          </Tooltip>
          <InputNumber
            value={1 - config.predictionInterval}
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
};

export default GenesVsUMIsConfig;
