/* eslint-disable react/no-array-index-key */
import React from 'react';
import { useSelector } from 'react-redux';
import {
  Modal, Form, Button, Select, InputNumber, Row, Alert, Col,
} from 'antd';
import PropTypes from 'prop-types';

const formItemStyle = { margin: '0.375rem 0' };

const CreateCellSetModal = (props) => {
  const { onCancel } = props;
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [form] = Form.useForm();
  const comparisonOptions = [{
    value: 'greaterThan',
    label: 'Greater than',
  }, {
    value: 'lessThan',
    label: 'Less than',
  },
  ];

  const intialFormValues = selectedGenes.map((gene) => ({
    selectedGenes: gene,
    value: 0,
    comparison: comparisonOptions[0].value,
  }));

  return (
    <Modal
      visible
      title='Create a new cell set based on gene expression'
      onCancel={onCancel}
      footer={[<Button key='createCellSet' type='primary'>Create</Button>]}
    >
      <Form
        form={form}
        size='middle'
        style={{ marginBottom: '1rem' }}
      >
        <Form.List
          name='filterForm'
          initialValue={intialFormValues}
        >
          {(fields) => (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>
              {fields.map((field, index) => {
                const { selectedGenes: formSelectedGenes } = form.getFieldValue('filterForm')[index];
                return (
                  <Row gutter={8} key={`geneComparison-${index}`}>
                    <Col flex='auto'>
                      <Form.Item
                        name={[field.name, 'selectedGenes']}
                        style={formItemStyle}
                      >
                        <strong>{formSelectedGenes}</strong>
                      </Form.Item>
                    </Col>
                    <Col>
                      <Form.Item
                        name={[field.name, 'comparison']}
                        style={formItemStyle}
                      >
                        <Select
                          placeholder='Select comparison'
                          options={comparisonOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Form.Item
                        name={[field.name, 'value']}
                        style={formItemStyle}
                      >
                        <InputNumber
                          step={1}
                          min={0}
                          max={100}
                          placeholder='Insert value'
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              })}
            </div>
          )}
        </Form.List>
      </Form>
      <Alert type='info' message='To edit the list of genes, return to the gene list and change your selection.' />
    </Modal>
  );
};

CreateCellSetModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
};

export default CreateCellSetModal;
