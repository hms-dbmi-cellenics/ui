import React, { useState } from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';

const MultiSelect = (props) => {
  const { items } = props;

  const [selectedItems, setSelectedItems] = useState([]);

  const filteredItems = items.filter((o) => !selectedItems.includes(o));

  return (
    <Select
      mode='multiple'
      onChange={setSelectedItems}
      value={selectedItems}
      style={{ width: '200px' }}
    >
      {filteredItems.map((item) => <Select.Option key={item} value={item} />)}
    </Select>
  );
};

MultiSelect.propTypes = {
  items: PropTypes.array.isRequired,
};

export default MultiSelect;
