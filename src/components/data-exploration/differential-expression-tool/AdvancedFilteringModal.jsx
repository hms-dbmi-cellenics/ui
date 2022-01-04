import React, { useState } from 'react';
import {
  Modal, Form, Button, Space, Select, InputNumber, Dropdown, Menu, Tooltip,
} from 'antd';
import PropTypes from 'prop-types';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

const AdvancedFilteringModal = (props) => {
  const { onCancel } = props;
  const [form] = Form.useForm();
  const [valuesDomain, setValuesDomain] = useState([]);

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
        changeCriteria(presetFilters[e.key].criteria);
      }}
    >
      {Object.keys(presetFilters).map((filter) => (
        <Menu.Item key={filter}>
          {filter}
        </Menu.Item>
      ))}
    </Menu>
  );

  const changeCriteria = (criteria, index = null) => {
    let currentIndex = index;
    if (index === null) {
      const { filterForm } = form.getFieldsValue();
      currentIndex = filterForm.length - 1;
    }
    const currentDomains = valuesDomain;
    currentDomains[currentIndex] = valueRestrictions[criteria];
    setValuesDomain(currentDomains);
    // without the next line the form does not re-render, so the max and min values are not updated
    form.setFieldsValue({});
  };

  return (
    <Modal
      visible
      title='Advanced filters'
      onCancel={onCancel}
      // remove next line once the functionality is implemented
      footer={[<Tooltip title='Feature coming soon!'><Button disabled>Apply filters</Button></Tooltip>]}
      okText='Apply filters'
    >
      <Form form={form}>

        <Form.List
          name='filterForm'
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Space key={field.key} align='baseline'>
                  <Space direction='horizontal'>
                    <Form.Item
                      name={[field.name, 'criteria']}
                      fieldKey={[field.criteria, 'criteria']}
                    >
                      <Select
                        placeholder='Select criteria'
                        style={{ width: 140 }}
                        onChange={(value) => changeCriteria(value, index)}
                        options={criteriaOptions}
                      />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, 'condition']}
                      fieldKey={[field.condition, 'condition']}
                    >
                      <Select
                        placeholder='Select condition'
                        options={conditionOptions}
                        style={{ width: 150 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, 'value']}
                      fieldKey={[field.value, 'value']}
                    >
                      <InputNumber
                        style={{ width: 140 }}
                        min={valuesDomain[index] ? valuesDomain[index][0] : 0}
                        max={valuesDomain[index] ? valuesDomain[index][1] : 0}
                        placeholder='Insert value'
                      />
                    </Form.Item>
                  </Space>

                  <CloseOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}

              <Space direction='horizontal'>
                <Button onClick={add} block icon={<PlusOutlined />}>
                  Add custom filter
                </Button>
                <Dropdown overlay={renderPresetFilters(add)}>
                  <Button>
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
  onCancel: PropTypes.func.isRequired,
};

export default AdvancedFilteringModal;
