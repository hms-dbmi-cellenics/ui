
import React, { useState } from 'react';
import {
  Input, Select, Button, Tooltip,
} from 'antd';

import { UndoOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const { Search } = Input;
const { Option } = Select;

const FilterGenes = (props) => {
  const { filterGenes } = props;
  const [selectedOption, setSelectedOption] = useState('contains');

  const onSelectedOption = (newSelectedOption) => {
    console.log('just selected an option: ', newSelectedOption);
    setSelectedOption(newSelectedOption);
  };

  const onSearch = (text) => {
    let searchPattern;
    console.log('just finished search: ', text);
    if (selectedOption === 'starts with') {
      searchPattern = text.concat('%');
    }
    if (selectedOption === 'ends with') {
      searchPattern = '%'.concat(text);
    }
    if (selectedOption === 'contains') {
      searchPattern = '%'.concat(text, '%');
    }
    filterGenes(searchPattern);
  };

  return (
    <Input.Group compact>
      <Select defaultValue={selectedOption} size='small' onChange={onSelectedOption}>
        <Option value='starts with' size='small'>starts with</Option>
        <Option value='ends with' size='small'>ends with</Option>
        <Option value='contains' size='small'>contains</Option>
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
