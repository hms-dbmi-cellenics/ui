import React from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';

const MultiSelect = (props) => {
  const {
    onChange,
    placeholder,
    selectedKeys,
    options,
    style,
  } = props;

  const formattedValues = options
    .filter(({ key }) => selectedKeys.includes(key))
    .map(({ key, name }) => ({ label: name, value: key }));

  return (
    <Select
      mode='multiple'
      allowClear
      labelInValue
      value={formattedValues}
      onChange={(values) => {
        onChange(values.map(({ value }) => value));
      }}
      style={style}
      placeholder={placeholder}
      fieldNames={{ label: 'name', value: 'key' }}
      options={options}
      filterOption={
        (searchText, { name }) => name.toLowerCase().match(searchText.toLowerCase())
      }
    />
  );
};

MultiSelect.propTypes = {
  options: PropTypes.array,
  style: PropTypes.object,
  selectedKeys: PropTypes.array,
  onChange: PropTypes.func,
  placeholder: PropTypes.node,
};

MultiSelect.defaultProps = {
  selectedKeys: [],
  options: [],
  style: {},
  onChange: () => { },
  placeholder: null,
};

export default MultiSelect;
