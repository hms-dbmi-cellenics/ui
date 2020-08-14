import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
} from 'antd';


const DimensionsRangeEditor = (props) => {
  const { onUpdate, config } = props;

  return (
    <>
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
            defaultValue={config.width}
            min={400}
            max={1200}
            onAfterChange={(value) => {
              onUpdate({ width: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Height'
        >
          <Slider
            defaultValue={config.height}
            min={200}
            max={1000}
            onAfterChange={(value) => {
              onUpdate({ height: value });
            }}
          />
        </Form.Item>
      </Form>
    </>
  );
};

DimensionsRangeEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default DimensionsRangeEditor;
