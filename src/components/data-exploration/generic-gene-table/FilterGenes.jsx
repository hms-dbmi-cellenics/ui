
import React, { useState } from 'react';
import {
  Input, Select,
} from 'antd';

import PropTypes from 'prop-types';

const { Search } = Input;
const { Option } = Select;

export const sanitizeString = (str) => str.replace(/[\s|-]+/g, '').toUpperCase();

const FilterGenes = (props) => {
  const { onFilter, defaultFilterOption, defaultFilterString } = props;

  const [filterOption, setFilterOption] = useState(defaultFilterOption);
  const [filterString, setFilterString] = useState(defaultFilterString);

  const onSelectedOption = (newSelectedOption) => {
    setFilterOption(newSelectedOption);
    onFilter({ filterOption: newSelectedOption, text: filterString });
  };

  const onSearch = (event) => {
    const text = sanitizeString(event.target.value);
    setFilterString(text);
    onFilter({ filterOption, text });
  };

  return (
    <Input.Group compact>
      <Select defaultValue={filterOption} style={{ width: '25%' }} size='small' onChange={onSelectedOption}>
        <Option value='Starts with' size='small'>starts with</Option>
        <Option value='Ends with' size='small'>ends with</Option>
        <Option value='Contains' size='small'>contains</Option>
      </Select>
      <Search
        placeholder='Filter genes ...'
        defaultValue={defaultFilterString}
        style={{ width: '75%' }}
        onChange={onSearch}
        allowClear
        size='small'
      />
    </Input.Group>
  );
};

FilterGenes.defaultProps = {
  defaultFilterOption: 'Contains',
  defaultFilterString: null,
};

FilterGenes.propTypes = {
  onFilter: PropTypes.func.isRequired,
  defaultFilterOption: PropTypes.string,
  defaultFilterString: PropTypes.string,
};

export default FilterGenes;
