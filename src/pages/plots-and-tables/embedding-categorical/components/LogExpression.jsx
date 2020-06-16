import React, { useState } from 'react';

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
            <Radio value='datum.TGFB1*1'>Standard</Radio>
            <Radio value='log(datum.TGFB1 + 10)'>Log</Radio>


          </Radio.Group>


        </Form.Item>


      </Form>
    </>
  );
};

export default LogExpression;
