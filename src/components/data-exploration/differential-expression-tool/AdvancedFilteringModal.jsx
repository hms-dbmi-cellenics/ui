import React from 'react';
import {
  Modal, Form, Button, Space, Select, InputNumber, Dropdown, Menu,
} from 'antd';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { DIFF_EXPR_ADV_FILTERS_SET } from 'redux/actionTypes/differentialExpression';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

const AdvancedFilteringModal = (props) => {
  const { onCancel, onLaunch } = props;
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const advancedFilters = useSelector((state) => state.differentialExpression.comparison.advancedFilters) || [];

  const criteriaOptions = [
    { value: 'logfc', label: 'logFC' },
    { value: 'pValue', label: 'adj p-value' },
    { value: 'pct1', label: 'Pct1' },
    { value: 'pct2', label: 'Pct2' },
    { value: 'auc', label: 'AUC' },
  ];

  const conditionOptions = [{
    value: 'gt',
    label: 'Greater than',
  }, {
    value: 'lt',
    label: 'Less than',
  },
  ];

  const valueRestrictions = {
    pct1: [0, 100],
    pct2: [0, 100],
    logfc: [-50, 50],
    auc: [0, 1],
    pValue: [0, 1],
  };

  const presetFilters = {
    'Up-regulated': {
      criteria: 'logfc',
      condition: 'gt',
      value: 0,
    },
    'Down-regulated': {
      criteria: 'logfc',
      condition: 'lt',
      value: 0,
    },
    Significant: {
      criteria: 'pValue',
      condition: 'lt',
      value: 0.05,
    },
  };
  const renderPresetFilters = (add) => (
    <Menu
      onClick={(e) => {
        add(presetFilters[e.key]);
      }}
    >
      {Object.keys(presetFilters).map((filter) => (
        <Menu.Item key={filter}>
          {filter}
        </Menu.Item>
      ))}
    </Menu>
  );

  const updateAdvancedFilters = () => {
    const formValues = form.getFieldsValue('filterForm').filterForm;
    const formValuesFiltered = formValues.map(
      ({ condition, criteria, value }) => ({ condition, criteria, value }),
    );
    dispatch({
      type: DIFF_EXPR_ADV_FILTERS_SET,
      payload: {
        advancedFilters: formValuesFiltered,
      },
    });
  };

  const applyFilters = () => {
    updateAdvancedFilters();
    onLaunch();
    onCancel();
  };

  return (
    <Modal
      visible
      title='Advanced filters'
      onCancel={() => { onCancel(); updateAdvancedFilters(); }}
      onOk={() => { updateAdvancedFilters(); applyFilters(); }}
      okText='Apply filters'
    >
      <Form form={form}>

        <Form.List
          name='filterForm'
          initialValue={advancedFilters}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const { criteria } = form.getFieldValue('filterForm')[index];
                return (
                  <Space key={field.key} align='baseline'>
                    <Space direction='horizontal'>
                      <Form.Item
                        name={[field.name, 'criteria']}
                      >
                        <Select
                          placeholder='Select criteria'
                          style={{ width: 140 }}
                          onChange={() => form.setFieldsValue({})}
                          options={criteriaOptions}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'condition']}
                      >
                        <Select
                          placeholder='Select condition'
                          options={conditionOptions}
                          style={{ width: 150 }}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'value']}

                      >
                        <InputNumber
                          style={{ width: 140 }}
                          step={criteria ? valueRestrictions[criteria][1] / 100 : 1}
                          min={criteria ? valueRestrictions[criteria][0] : 0}
                          max={criteria ? valueRestrictions[criteria][1] : 0}
                          placeholder='Insert value'
                        />
                      </Form.Item>
                    </Space>

                    <CloseOutlined onClick={() => remove(field.name)} />
                  </Space>
                );
              })}
              <Space direction='horizontal'>
                <Button onClick={add} icon={<PlusOutlined />}>
                  Add custom filter
                </Button>
                <Dropdown overlay={renderPresetFilters(add)}>
                  <Button icon={<PlusOutlined />}>
                    Add preset filter
                  </Button>
                </Dropdown>
              </Space>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

AdvancedFilteringModal.propTypes = {
  onLaunch: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AdvancedFilteringModal;
