import _ from 'lodash';
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';

const DimensionsRangeEditor = (props) => {
  const {
    width,
    height,
    onWidthUpdate,
    onHeightUpdate,
    maxHeight,
    maxWidth,
  } = props;

  const minWidth = 400;
  const widthMarks = {};
  widthMarks[minWidth] = minWidth;
  widthMarks[maxWidth] = maxWidth;

  const minHeight = 200;
  const heighthMarks = {};
  heighthMarks[minHeight] = minHeight;
  heighthMarks[maxHeight] = maxHeight;

  const onHeightUpdateThrottled = useRef(_.throttle((val) => { onHeightUpdate(val); }, 10));
  const onWidthUpdateThrottled = useRef(_.throttle((val) => { onWidthUpdate(val); }, 10));

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
            value={width}
            min={minWidth}
            max={maxWidth}
            onChange={(val) => onWidthUpdateThrottled.current(val)}
            marks={widthMarks}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            value={height}
            min={minHeight}
            max={maxHeight}
            onChange={(val) => onHeightUpdateThrottled.current(val)}
            marks={heighthMarks}
          />
        </Form.Item>
      </Form>
    </Space>
  );
};

DimensionsRangeEditor.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  onWidthUpdate: PropTypes.func.isRequired,
  onHeightUpdate: PropTypes.func.isRequired,
  maxHeight: PropTypes.number,
  maxWidth: PropTypes.number,
};

DimensionsRangeEditor.defaultProps = {
  width: 400,
  height: 400,
  maxHeight: 1000,
  maxWidth: 1200,
};

export default DimensionsRangeEditor;
