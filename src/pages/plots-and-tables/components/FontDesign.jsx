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

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div> Font Styles </div>
        <Form.Item>
          <Radio.Group onChange={onChange} value={masterfont}>
            <Radio style={radioStyle} value='sans-serif'>Sans-serif</Radio>
            <Radio style={radioStyle} value='sans'>Sans</Radio>
            <Radio style={radioStyle} value='monospace'>Monospace</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

FontDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default FontDesign;
