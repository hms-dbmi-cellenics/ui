import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form, Space, InputNumber, Button,
} from 'antd';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const DisplayLabels = (props) => {
  const {
    config, onUpdate, min, max,
  } = props;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config, 200);
  const [
    localTextThresholdValue,
    setLocalTextThresholdValue,
  ] = useState(newConfig.textThresholdValue);

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Display Gene Labels Above (-log10 pvalue)</strong></p>

        <Form.Item
          label='Min. -log10 pvalue'
        >
          <>  </>
          <InputNumber
            data-testid='thresholdInput'
            value={localTextThresholdValue}
            min={min}
            max={max}
            onChange={(value) => {
              setLocalTextThresholdValue(value);
            }}
          />
        </Form.Item>
        <Form.Item>
          <Button
            data-testid='saveThreshold'
            size='small'
            type='primary'
            onClick={() => {
              handleChange({ textThresholdValue: localTextThresholdValue });
            }}
          >
            Save
          </Button>
        </Form.Item>
      </Form>
    </Space>
  );
};

DisplayLabels.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default DisplayLabels;
