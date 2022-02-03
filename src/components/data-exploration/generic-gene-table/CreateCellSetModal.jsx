import React from 'react';
import {
  Modal, Form, Button, Space, Select, InputNumber, Typography, Divider, Row, Alert,
} from 'antd';// import PropTypes from 'prop-types';
import PropTypes from 'prop-types';

const { Title } = Typography;

const CreateCellSetModal = (props) => {
  const { selectedGenes, onCancel } = props;
  const [form] = Form.useForm();
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

  const formHeight = selectedGenes.length < 5 ? selectedGenes.length * 75 : 300;
  return (
    <Modal
      visible
      title='Create a new cell set based on gene expression'
      onCancel={onCancel}
      footer={null}
      width='530px'
    >
      <Form
        form={form}
        onFinish={({ filterForm }) => createCellSet(filterForm)}
        size='middle'
      >
        <Form.List
          name='filterForm'
          initialValue={intialFormValues}
        >
          {(fields) => (
            <>
              <Row style={{ overflow: 'scroll', height: formHeight }}>
                {fields.map((field, index) => {
                  const { selectedGenes: formSelectedGenes } = form.getFieldValue('filterForm')[index];
                  return (
                    <Space key={field.key} align='baseline'>
                      <Form.Item
                        name={[field.name, 'selectedGenes']}
                        style={{ width: 70, height: 40 }}
                      >
                        <Title level={5}>{formSelectedGenes}</Title>
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'comparison']}
                        style={{ width: 150 }}
                      >
                        <Select
                          placeholder='Select comparison'
                          defaultValue='greaterThan'
                          options={comparisonOptions}
                          style={{ width: 150 }}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'value']}
                      >
                        <InputNumber
                          style={{ width: 140 }}
                          defaultValue={0}
                          step={1}
                          min={0}
                          max={100}
                          placeholder='Insert value'
                        />
                      </Form.Item>
                    </Space>
                  );
                })}
              </Row>
              <Alert type='info' message='To edit the list of genes, return to the gene list and change your selection.' />
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
