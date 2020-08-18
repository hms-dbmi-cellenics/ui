
import React, { useState } from 'react';
import {
  Input, Select,
} from 'antd';

import PropTypes from 'prop-types';

const { Search } = Input;
const { Option } = Select;

const FilterGenes = (props) => {
  const { filterGenes } = props;
  const [selectedOption, setSelectedOption] = useState('Contains');

  const onSelectedOption = (newSelectedOption) => {
    setSelectedOption(newSelectedOption);
  };

  const onSearch = (text) => {
    let searchPattern;
    if (selectedOption === 'Starts with') {
      searchPattern = text.concat('%');
    }
    if (selectedOption === 'Ends with') {
      searchPattern = '%'.concat(text);
    }
    if (selectedOption === 'Contains') {
      searchPattern = '%'.concat(text, '%');
    }
    filterGenes(searchPattern);
  };

  return (
    <Input.Group compact>
      <Select defaultValue={selectedOption} style={{ width: 120 }} size='small' onChange={onSelectedOption}>
        <Option value='Starts with' size='small'>starts with</Option>
        <Option value='Ends with' size='small'>ends with</Option>
        <Option value='Contains' size='small'>contains</Option>
      </Select>
      <Search
        placeholder='Filter genes ...'
        style={{ width: 200 }}
        onSearch={onSearch}
        allowClear
        size='small'
      />
    </Input.Group>
  );
};

FilterGenes.defaultProps = {};

FilterGenes.propTypes = {
  filterGenes: PropTypes.func.isRequired,
};

export default FilterGenes;
