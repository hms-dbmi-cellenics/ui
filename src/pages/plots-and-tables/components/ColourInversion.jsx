import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ColourInversion = (props) => {
  const { onUpdate, config } = props;
  const [toggleInvert, settoggleInvert] = useState(config.toggleInvert);
  const onChange = (e) => {
    settoggleInvert(e.target.value);
    onUpdate({ toggleInvert: e.target.value });
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Background</div>
        <Form.Item>
          <Radio.Group onChange={onChange} value={toggleInvert}>
            <Radio value='#FFFFFF'>Standard</Radio>
            <Radio value='#000000'>Invert</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ColourInversion.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ColourInversion;
