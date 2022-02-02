import React from 'react';
import {
  Modal, Form, Button, Space, Select, InputNumber, Dropdown, Menu, Divider, Row,
} from 'antd';// import PropTypes from 'prop-types';
import PropTypes from 'prop-types';
import { CloseOutlined } from '@ant-design/icons';

const CreateCellSetModal = (props) => {
  const { selectedGenes, onCancel } = props;
  const [form] = Form.useForm();
  const geneOptionsSelect = selectedGenes.map((gene) => ({ value: gene, label: gene }));
  const intialFormValues = selectedGenes.map((gene) => ({ selectedGenes: gene }));
  const createCellSet = (filterForm) => {
    console.log('filter form is ', filterForm);
  };
  const comparisonOptions = [{
    value: 'greaterThan',
    label: 'Greater than',
  }, {
    value: 'lessThan',
    label: 'Less than',
  },
  ];
  return (
    <Modal
      visible
      title='Advanced filters'
      onCancel={onCancel}
      footer={null}
      width='530px'
    >
      <Form form={form} onFinish={({ filterForm }) => createCellSet(filterForm)}>
        <Form.List
          name='filterForm'
          initialValue={intialFormValues}
        >
          {(fields, { add, remove }) => (
            <>
              <Row>
                {fields.map((field, index) => {
                  const { selectedGenes: formSelectedGenes } = form.getFieldValue('filterForm')[index];
                  console.log('Selected genes are ', formSelectedGenes);
                  return (
                    <Space key={field.key} align='baseline'>
                      <Form.Item
                        name={[field.name, 'selectedGenes']}
                        rules={[{ required: true, message: 'Please select a property' }]}
                      >
                        <Select
                          style={{ width: 140 }}
                          onChange={() => form.setFieldsValue({})}
                          options={geneOptionsSelect}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'comparison']}
                        rules={[{ required: true, message: 'Please select a comparison' }]}
                      >
                        <Select
                          placeholder='Select comparison'
                          options={comparisonOptions}
                          style={{ width: 150 }}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'value']}
                        rules={[{ required: true, message: 'Please input a value' }]}
                      >
                        <InputNumber
                          style={{ width: 140 }}
                          step={1}
                          min={0}
                          max={100}
                          placeholder='Insert value'
                        />
                      </Form.Item>

                      <CloseOutlined onClick={() => remove(field.name)} style={{ margin: '8px' }} />
                    </Space>
                  );
                })}
              </Row>
              <Divider style={{ marginBottom: '10px' }} />
              <div align='end' style={{ marginTop: '0px', width: '100%' }}>
                <Form.Item style={{ marginBottom: '-10px', marginTop: '0px' }}>
                  <Button type='primary' htmlType='submit'>
                    Create
                  </Button>
                </Form.Item>
              </div>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
CreateCellSetModal.propTypes = {
  selectedGenes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateCellSetModal;
