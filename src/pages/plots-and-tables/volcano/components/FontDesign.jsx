import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const FontDesign = (props) => {
  const { onUpdate, config } = props;
  const [masterfont, setmasterfont] = useState(config.masterFont);
  const onChange = (e) => {
    setmasterfont(e.target.value);
    onUpdate({ masterFont: e.target.value });
  };

  return (
    <Form
      size='small'
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 12 }}
    >
      <div> Font Styles </div>
      <Form.Item>
        <Radio.Group onChange={onChange} value={masterfont}>
          <Radio value='sans-serif'>Sans-serif</Radio>
          <Radio value='sans'>Sans</Radio>
          <Radio value='monospace'>Monospace</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

FontDesign.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default FontDesign;
