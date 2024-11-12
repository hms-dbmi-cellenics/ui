import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Space } from 'antd';

const SelectableList = ({
  onChange, listData, leftItem, rightItem,
}) => {
  const [selectedItemKey, setSelectedItemKey] = useState(null);

  // Ensure only one item can be selected at a time
  const handleSelect = (key) => {
    // Toggle the item
    const newSelectedKey = key === selectedItemKey ? null : key;
    setSelectedItemKey(newSelectedKey);
    onChange(newSelectedKey);
  };

  // This is so that a click on toggle doesn't close the menu
  const stopPropagationEvent = (e) => e.stopPropagation();

  const composeItem = (itemData, i) => (
    <div
      key={i}
      onKeyDown={stopPropagationEvent}
    >
      {leftItem(itemData, i)}
      {rightItem(itemData, i)}
    </div>
  );

  return (
    <Space direction='vertical'>
      {listData.map((itemData, i) => composeItem(itemData, i))}
    </Space>
  );
};

SelectableList.propTypes = {
  onChange: PropTypes.func.isRequired,
  listData: PropTypes.array.isRequired,
  leftItem: PropTypes.func,
  rightItem: PropTypes.func,
};

SelectableList.defaultProps = {
  leftItem: () => { },
  rightItem: () => { },
};

export default SelectableList;
