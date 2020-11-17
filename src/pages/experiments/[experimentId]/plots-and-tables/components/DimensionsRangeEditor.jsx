import _ from 'lodash';
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';

const DimensionsRangeEditor = (props) => {
  const {
    onUpdate, config, maxHeight, maxWidth,
  } = props;

  const minWidth = 400;
  const widthMarks = {};
  widthMarks[minWidth] = minWidth;
  widthMarks[maxWidth] = maxWidth;

  const minHeight = 200;
  const heighthMarks = {};
  heighthMarks[minHeight] = minHeight;
  heighthMarks[maxHeight] = maxHeight;
  const onUpdateThrottled = useRef(_.throttle((obj) => { onUpdate(obj); }, 10));
  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      Dimensions
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <Form.Item
          label='Width'
        >
          <Slider
            value={config.width}
            min={minWidth}
            max={maxWidth}
            onChange={(value) => {
              onUpdateThrottled.current({ width: value });
            }}
            marks={widthMarks}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            value={config.height}
            min={minHeight}
            max={maxHeight}
            onChange={(value) => {
              onUpdateThrottled.current({ height: value });
            }}
            marks={heighthMarks}
          />
        </Form.Item>
      </Form>
    </Space>
  );
};

DimensionsRangeEditor.defaultProps = {
  maxHeight: 1000,
  maxWidth: 1200,
};

DimensionsRangeEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  maxHeight: PropTypes.number,
  maxWidth: PropTypes.number,
};

export default DimensionsRangeEditor;
