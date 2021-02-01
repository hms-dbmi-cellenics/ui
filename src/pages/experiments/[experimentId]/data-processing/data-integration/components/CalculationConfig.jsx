import React from 'react';

import {
  Space, Select, InputNumber, Form, Checkbox,
} from 'antd';

const { Option } = Select;

const CalculationConfig = () => (
  <div>
    <Space direction='vertical' style={{ width: '100%' }} />
    <Form.Item
      label='Method:'
    >
      <Select
        defaultValue='option1'
      >
        <Option value='option1'>PCA</Option>
        <Option value='option2'>option2</Option>
        <Option value='option3'>option3</Option>
      </Select>
    </Form.Item>
    <Form.Item label='Max PCs:'>
      <InputNumber
        defaultValue={10}
        max={50}
        min={1}
        onPressEnter={() => { }}
      />
    </Form.Item>
    <Form.Item label='Exclude genes categories:'>
      <Checkbox.Group onChange={() => { }}>
        <Space direction='vertical'>
          <Checkbox value='ribosomal'>ribosomal</Checkbox>
          <Checkbox value='mitochondrial'>mitochondrial</Checkbox>
          <Checkbox value='cellCycle'>cell cycle</Checkbox>
        </Space>
      </Checkbox.Group>
    </Form.Item>
  </div>
);

export default CalculationConfig;
