/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal, Form, Button, Select, InputNumber, Row, Alert, Col,
} from 'antd';

import createCellSetByExpression from 'redux/actions/cellSets/createCellSetByExpression';

const formItemStyle = { margin: '0.375rem 0' };
const FORM_NAME = 'filterForm';

const ExpressionCellSetModal = (props) => {
  const { onCancel } = props;

  const [isCreatingCellSet, setIsCreatingCellSet] = useState(false);

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

  const createExpressionCellSet = async () => {
    const formValues = form.getFieldValue(FORM_NAME);
    setIsCreatingCellSet(true);
    try {
      await dispatch(createCellSetByExpression(experimentId, formValues));
      setIsCreatingCellSet(false);
      onCancel();
    } catch (e) {
      setIsCreatingCellSet(false);
    }
  };

  return (
    <Modal
      open
      title='Create a new cell set based on gene expression'
      onCancel={onCancel}
      footer={[
        <Button
          key='createExpressionCellSet'
          type='primary'
          loading={isCreatingCellSet}
          disabled={isCreatingCellSet}
          onClick={createExpressionCellSet}
        >
          {isCreatingCellSet ? 'Creating cell set...' : 'Create'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        size='middle'
        style={{ marginBottom: '1rem' }}
        initialValues={{
          geneName: '',
          comparisonType: 'greaterThan',
          thresholdValue: 0,
        }}
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
                          step={0.01}
                          min={0}
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
      <Alert type='info' message='To edit the list of genes, return to the gene list and change your selection.' style={{ margin: '0.5em 0' }} />
      <Alert
        type='warning'
        message={(
          <>
            Due to
            {' '}
            <a href='https://www.nature.com/articles/s41467-020-14976-9' target='_blank' rel='noreferrer'>high dropout</a>
            {' '}
            in scRNA-seq, cell sets defined using only a few genes are potentially misleading. We recommend using these cell sets for exploratory purposes only and to use computed clusters for comparisons.
          </>
        )}
      />
    </Modal>
  );
};

ExpressionCellSetModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
};

export default ExpressionCellSetModal;
