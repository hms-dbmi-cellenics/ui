import React from 'react';
import {
  Modal, Form, Button, Space, Select, InputNumber, Dropdown, Menu,
} from 'antd';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

const AdvancedFilteringModal = (props) => {
  const { onCancel, onLaunch } = props;
  const [form] = Form.useForm();
  const advancedFilters = useSelector((state) => state.differentialExpression.comparison.advancedFilters) || [];
  const diffExprLoading = useSelector((state) => state.differentialExpression.properties.loading);

  const criteriaOptions = [
    { value: 'logFC', label: 'logFC' },
    { value: 'p_val_adj', label: 'adj p-value' },
    { value: 'pct_1', label: 'Pct1' },
    { value: 'pct_2', label: 'Pct2' },
    { value: 'auc', label: 'AUC' },
  ];

  const comparisonOptions = [{
    value: 'greaterThan',
    label: 'Greater than',
  }, {
    value: 'lessThan',
    label: 'Less than',
  },
  ];

  const valueRestrictions = {
    pct_1: [0, 100],
    pct_2: [0, 100],
    logFC: [-50, 50],
    auc: [0, 1],
    p_val_adj: [0, 1],
  };

  const presetFilters = {
    'Up-regulated': {
      columnName: 'logFC',
      comparison: 'greaterThan',
      value: 0,
    },
    'Down-regulated': {
      columnName: 'logFC',
      comparison: 'lessThan',
      value: 0,
    },
    Significant: {
      columnName: 'p_val_adj',
      comparison: 'lessThan',
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

  const applyFilters = () => {
    const formValues = form.getFieldsValue('filterForm').filterForm;
    const formValuesFiltered = formValues.map(
      ({ comparison, columnName, value }) => ({
        comparison, columnName, value, type: 'numeric',
      }),
    );
    onLaunch(formValuesFiltered);
  };

  return (
    <Modal
      visible
      title='Advanced filters'
      onCancel={onCancel}
      onOk={applyFilters}
      okButtonProps={diffExprLoading ? { disabled: true } : {}}
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
                const { columnName } = form.getFieldValue('filterForm')[index];
                return (
                  <Space key={field.key} align='baseline'>
                    <Space direction='horizontal'>
                      <Form.Item
                        name={[field.name, 'columnName']}
                      >
                        <Select
                          placeholder='Select columnName'
                          style={{ width: 140 }}
                          onChange={() => form.setFieldsValue({})}
                          options={criteriaOptions}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'comparison']}
                      >
                        <Select
                          placeholder='Select comparison'
                          options={comparisonOptions}
                          style={{ width: 150 }}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'value']}

                      >
                        <InputNumber
                          style={{ width: 140 }}
                          step={columnName ? valueRestrictions[columnName][1] / 100 : 1}
                          min={columnName ? valueRestrictions[columnName][0] : 0}
                          max={columnName ? valueRestrictions[columnName][1] : 0}
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
