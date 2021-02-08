import _ from 'lodash';
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';

const DimensionsRangeEditorVolcano = (props) => {
  const {
    config, onUpdate, yMax, xMax,
  } = props;
  const onUpdateThrottled = useRef(_.throttle((obj) => onUpdate(obj), 10));

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Dimensions</div>

        <Form.Item
          label='Width'
        >
          <Slider
            value={config.width}
            min={200}
            max={1000}
            onChange={(value) => {
              onUpdateThrottled.current({ width: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            value={config.height}
            min={200}
            max={1000}
            onChange={(value) => {
              onUpdateThrottled.current({ height: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Y-axis Range'
        >
          <Slider
            value={yMax}
            min={0}
            max={yMax}
            onChange={(value) => {
              onUpdateThrottled.current({ maxNegativeLogpValueDomain: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='X-axis Range'
        >
          <Slider
            value={xMax}
            min={0}
            max={xMax}
            onChange={(value) => {
              onUpdateThrottled.current({ logFoldChangeDomain: value });
            }}
          />
        </Form.Item>

      </Form>
    </Space>
  );
};

DimensionsRangeEditorVolcano.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  yMax: PropTypes.number.isRequired,
  xMax: PropTypes.number.isRequired,
};

export default DimensionsRangeEditorVolcano;
