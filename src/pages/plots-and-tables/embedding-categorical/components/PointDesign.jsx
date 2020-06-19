import React, { useState } from 'react';

import {
  Slider, Form,
  Radio, Collapse,
} from 'antd';
import PropTypes from 'prop-types';

const PointDesign = (props) => {
  const { onUpdate, config } = props;


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
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default PointDesign;
