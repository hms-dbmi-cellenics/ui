import React from 'react';
import {
  Modal, Form, Button, Space, Select, InputNumber, Dropdown, Menu,
} from 'antd';
import PropTypes from 'prop-types';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

const AdvancedFilteringModal = (props) => {
  const { onCancel } = props;

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

  const renderPresetFilters = (add) => {
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

    return (
      <Menu
        onClick={(e) => { add(presetFilters[e.key]); }}
      >
        {Object.keys(presetFilters).map((filter) => (
          <Menu.Item key={filter}>
            {filter}
          </Menu.Item>
        ))}
      </Menu>
    );
  };

  return (
    <Modal
      visible
      title='Advanced filters'
      onCancel={() => onCancel()}
    >
      <Form>

        <Form.List
          name='filterForm'
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align='baseline'>
                  <Space direction='horizontal'>
                    <Form.Item
                      name={[field.name, 'criteria']}
                      fieldKey={[field.criteria, 'criteria']}
                    >
                      <Select
                        placeholder='Select criteria'
                        style={{ width: 140 }}
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
                        style={{ width: 140 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, 'value']}
                      fieldKey={[field.value, 'condition']}
                    >
                      <InputNumber
                        style={{ width: 140 }}
                        placeholder='Insert value'
                      />
                    </Form.Item>
                  </Space>

                  <CloseOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}

              <Space direction='horizontal'>
                <Button onClick={() => add()} block icon={<PlusOutlined />}>
                  Add filter
                </Button>
                <Dropdown overlay={renderPresetFilters(add)}>
                  <Button>
                    Preset filters
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
