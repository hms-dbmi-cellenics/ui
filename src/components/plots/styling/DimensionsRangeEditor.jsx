import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const DimensionsRangeEditor = (props) => {
  const {
    onUpdate, config, maxHeight, maxWidth,
  } = props;

  const minWidth = 200;
  const widthMarks = {};
  widthMarks[minWidth] = minWidth;
  widthMarks[maxWidth] = maxWidth;

  const minHeight = 200;
  const heighthMarks = {};
  heighthMarks[minHeight] = minHeight;
  heighthMarks[maxHeight] = maxHeight;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <p><strong>Dimensions</strong></p>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <Form.Item
          label='Width'
        >
          <Slider
            value={newConfig.dimensions.width}
            min={minWidth}
            max={maxWidth}
            onChange={(value) => {
              handleChange({ dimensions: { width: value } });
            }}
            marks={widthMarks}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            value={newConfig.dimensions.height}
            min={minHeight}
            max={maxHeight}
            onChange={(value) => {
              handleChange({ dimensions: { height: value } });
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
