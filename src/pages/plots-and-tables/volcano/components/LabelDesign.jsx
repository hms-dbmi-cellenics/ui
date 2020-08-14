import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, InputNumber, Checkbox, Space,
} from 'antd';


const ApplyTextLabels = (props) => {
  const { onUpdate } = props;

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Significance thresholds</div>
        <Form.Item
          label={(
            <span>
              p-value
              {' '}
              <em>(linear)</em>
            </span>
          )}
        >
          <Space>
            <InputNumber
              min={0}
              defaultValue={1e-8}
              onPressEnter={(e) => {
                const value = parseFloat(e.target.value);
                onUpdate({ pvalueThreshold: value });
              }}
            />
            <Checkbox
              onChange={(e) => {
                const { checked } = e.target;

                if (checked) {
                  onUpdate({ showpvalueThresholdGuides: true });
                } else {
                  onUpdate({ showpvalueThresholdGuides: false });
                }
              }}
            >
              Guides
            </Checkbox>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

ApplyTextLabels.propTypes = {
  onUpdate: PropTypes.func.isRequired,
};

export default ApplyTextLabels;
