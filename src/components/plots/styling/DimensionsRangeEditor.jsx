import React from 'react';
import PropTypes from 'prop-types';
import { Form, Space } from 'antd';
import DebouncedSlider from './DebouncedSlider';

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

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <p><strong>Dimensions:</strong></p>
      <Form
        size='small'
        labelCol={{ span: 6, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 16 }}
      >
        <Form.Item
          label='Width'
        >
          <DebouncedSlider
            value={config.dimensions.width}
            min={minWidth}
            max={maxWidth}
            path='dimensions.width'
            onUpdate={onUpdate}
            debounceMs={400}
            marks={widthMarks}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <DebouncedSlider
            value={config.dimensions.height}
            min={minHeight}
            max={maxHeight}
            path='dimensions.height'
            onUpdate={onUpdate}
            debounceMs={400}
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
