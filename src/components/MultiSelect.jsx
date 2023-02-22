import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';

const itemsFromKeys = (initialSelectedKeys, inputItems) => (
  initialSelectedKeys
    .map((key) => (inputItems.find((item) => item.key === key)))
    .filter((item) => !!item)
);

const MultiSelect = (props) => {
  const {
    items: inputItems,
    onChange,
    placeholder,
    initialSelectedKeys,
    style,
  } = props;

  const [selectedItems, setSelectedItems] = useState(
    itemsFromKeys(initialSelectedKeys, inputItems),
  );

  useEffect(() => {
    onChange(selectedItems);
  }, [selectedItems]);

  const filteredItems = inputItems.filter(
    (inputItem) => !selectedItems.find((selectedItem) => selectedItem.key === inputItem.key),
  );

  return (
    <Select
      mode='multiple'
      labelInValue
      value={selectedItems.map(({ key, name }) => ({ key, label: name }))}
      onChange={(newItems) => {
        setSelectedItems(
          newItems.map(({ key, label: name }) => ({ key, name })),
        );
      }}
      style={{ width: '200px', ...style }}
      placeholder={placeholder}
    >
      {filteredItems.map((item) => (
        <Select.Option key={item.key} value={item.key}>
          {item.name}
        </Select.Option>
      ))}
    </Select>
  );
};

MultiSelect.propTypes = {
  items: PropTypes.array,
  style: PropTypes.object,
  initialSelectedKeys: PropTypes.array,
  onChange: PropTypes.func,
  placeholder: PropTypes.node,
};

MultiSelect.defaultProps = {
  initialSelectedKeys: [],
  items: [],
  style: {},
  onChange: () => { },
  placeholder: null,
};

export default MultiSelect;
