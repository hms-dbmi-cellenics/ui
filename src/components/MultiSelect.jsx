import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';

const MultiSelect = (props) => {
  const { items, onChange, placeholder } = props;

  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    onChange(selectedItems);
  }, [selectedItems]);

  const filteredItems = items.filter((o) => !selectedItems.includes(o));

  return (
    <Select
      mode='multiple'
      onChange={setSelectedItems}
      value={selectedItems}
      style={{ width: '200px' }}
      placeholder={placeholder}
    >
      {filteredItems.map((item) => <Select.Option key={item} value={item} />)}
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
