import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';

const MultiSelect = (props) => {
  const { items: inputItems, onChange, placeholder } = props;

  const [selectedItems, setSelectedItems] = useState([]);

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
      onChange={(newItems) => setSelectedItems(
        newItems.map(({ key, label: name }) => ({ key, name })),
      )}
      style={{ width: '200px' }}
      placeholder={placeholder}
    >
      {filteredItems.map((item) => (
        <Select.Option value={item.key}>
          {item.name}
        </Select.Option>
      ))}
    </Select>
  );
};

MultiSelect.propTypes = {
  items: PropTypes.array.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.node,
};

MultiSelect.defaultProps = {
  onChange: () => { },
  placeholder: null,
};

export default MultiSelect;
