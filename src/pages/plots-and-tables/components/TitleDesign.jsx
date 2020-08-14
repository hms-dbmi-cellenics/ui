import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form,
  Radio, Input,
} from 'antd';

const TitleDesign = (props) => {
  const { onUpdate, config } = props;
  const [titleAnchor, settitleAnchor] = useState(config.titleAnchor);

  const onChange = (e) => {
    settitleAnchor(e.target.value);
    onUpdate({ titleAnchor: e.target.value });
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Title Styles</div>

        <Form.Item
          label='Title Font Size'
        >
          <Slider
            defaultValue={20}
            min={15}
            max={40}
            onAfterChange={(value) => {
              onUpdate({ titleSize: value });
            }}
          />
        </Form.Item>

        <Form.Item
          label='Define Title'
        >
          <Input
            placeholder='Enter title'
            onPressEnter={(e) => {
              const { value } = e.target;
              onUpdate({ titleText: value });
            }}
          />

        </Form.Item>
        <Form.Item
          label='Title Location'
        >
          <Radio.Group onChange={onChange} value={titleAnchor}>
            <Radio value='start'>Left</Radio>
            <Radio value='middle'>Middle</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

TitleDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default TitleDesign;
