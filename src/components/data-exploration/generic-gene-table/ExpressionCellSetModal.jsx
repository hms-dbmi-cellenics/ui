/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal, Form, Button, Select, InputNumber, Row, Alert, Col,
} from 'antd';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import getCellSetsByExpression from 'redux/actions/cellSets/getExpressionCellSets';
import { createCellSet } from 'redux/actions/cellSets';
import colorProvider from 'utils/colorProvider';

const formItemStyle = { margin: '0.375rem 0' };
const FORM_NAME = 'filterForm';

const ExpressionCellSetModal = (props) => {
  const { onCancel } = props;

  const selectedGenes = useSelector((state) => state.genes.selected);
  const { experimentId } = useSelector((state) => state.experimentSettings.info);

  const dispatch = useDispatch();

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
    geneName: gene,
    comparisonType: comparisonOptions[0].value,
    thresholdValue: 0,
  }));

  const buildCellSetName = (formValues) => formValues.map(
    ({ geneName, comparisonType, thresholdValue }) => geneName
      + (comparisonType === 'greaterThan' ? '>' : '<')
      + thresholdValue,
  )
    .join('; ');

  const createExpressionCellSet = async () => {
    const formValues = form.getFieldValue(FORM_NAME);
    try {
      const expressionCellSet = await dispatch(getCellSetsByExpression(experimentId, formValues));
      const defaultCellSetName = buildCellSetName(formValues);

      dispatch(createCellSet(experimentId, defaultCellSetName, colorProvider.getColor(), expressionCellSet));
    } catch (e) {
      pushNotificationMessage('error', 'Error creating cell set. Please try again or notify us via the feedback button.');
    }
  };

  return (
    <Modal
      visible
      title='Create a new cell set based on gene expression'
      onCancel={onCancel}
      footer={[<Button key='createExpressionCellSet' type='primary' onClick={() => createExpressionCellSet()}>Create</Button>]}
    >
      <Form
        form={form}
        size='middle'
        style={{ marginBottom: '1rem' }}
      >
        <Form.List
          name={FORM_NAME}
          initialValue={intialFormValues}
        >
          {(fields) => (
            <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>
              {fields.map((field, index) => {
                const { geneName } = form.getFieldValue(FORM_NAME)[index];
                return (
                  <Row gutter={8} key={`geneComparison-${index}`}>
                    <Col flex='auto'>
                      <Form.Item
                        name={[field.name, 'geneName']}
                        style={formItemStyle}
                      >
                        <strong>{geneName}</strong>
                      </Form.Item>
                    </Col>
                    <Col>
                      <Form.Item
                        name={[field.name, 'comparisonType']}
                        style={{
                          ...formItemStyle,
                          width: '130px',
                        }}
                      >
                        <Select
                          placeholder='Select comparison'
                          options={comparisonOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Form.Item
                        name={[field.name, 'thresholdValue']}
                        style={{
                          ...formItemStyle,
                          width: '80px',
                        }}
                      >
                        <InputNumber
                          step={1}
                          min={0}
                          max={100}
                          defaultValue={0}
                          placeholder='Insert threshold value'
                          style={{ width: '100%' }}
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

ExpressionCellSetModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
};

export default ExpressionCellSetModal;
