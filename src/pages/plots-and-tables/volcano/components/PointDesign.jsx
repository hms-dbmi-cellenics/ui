import React, { useState } from 'react';

import {
  Slider, Form,
  Radio,
} from 'antd';

const PointDesign = (props) => {
  const { onUpdate, config } = props;

  const [radioval, setradioval] = useState(config.pointStyle);

  const onChange = (e) => {
    console.log('radio checked', e.target.value);
    setradioval(e.target.value);
    onUpdate({ pointStyle: e.target.value });
  };

  return (

    <Form
      size='small'
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 12 }}
    >
      <div>Point Style</div>
      <Form.Item
        label='Point Size'
      >
        <Slider
          defaultValue={32}
          min={2}
          max={70}
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
      <div>Point Shape</div>
      <Form.Item>
        <Radio.Group onChange={onChange} value={radioval}>
          <Radio value='circle'>Circle</Radio>
          <Radio value='cross'>Cross</Radio>
          <Radio value='diamond'>Diamond</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

export default PointDesign;
