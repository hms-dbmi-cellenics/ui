import React from 'react';
import {
  Slider, Form,
} from 'antd';
import PropTypes from 'prop-types';

const PointDesign = (props) => {
  const { onUpdate } = props;

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Styles</div>
        <Form.Item
          label='Point Size'
        >
          <Slider
            defaultValue={5}
            min={2}
            max={30}
            onAfterChange={(value) => {
              onUpdate({ pointSize: value });
            }}
          />
        </Form.Item>

        <Form.Item
          label='Point Fill Opacity'
        >
          <Slider
            defaultValue={5}
            min={1}
            max={10}
            onAfterChange={(value) => {
              onUpdate({ pointOpa: value });
            }}
          />
        </Form.Item>
      </Form>
    </>
  );
};

PointDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
};

export default PointDesign;
