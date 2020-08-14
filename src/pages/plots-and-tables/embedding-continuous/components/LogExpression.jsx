import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const LogExpression = (props) => {
  const { onUpdate, config } = props;
  const [logEquation, setlogEquation] = useState(config.logEquation);
  const onChange = (e) => {
    setlogEquation(e.target.value);
    onUpdate({ logEquation: e.target.value });
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Transform Gene Expression</div>
        <Form.Item>
          <Radio.Group onChange={onChange} value={logEquation}>
            <Radio value='datum.CST3*1'>Logged</Radio>
            <Radio value='exp(datum.CST3)-1'>Actual</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

LogExpression.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default LogExpression;
