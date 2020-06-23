import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  PlusOutlined,
} from '@ant-design/icons';

import {
  Input, Dropdown, Menu, Typography, Button,
} from 'antd';

const { Text } = Typography;

const SearchMenu = (props) => {
  const { options, onSelect } = props;
  const [filteredOptions, setFilteredOptions] = useState(options);

  const search = (text) => {
    const newFiltered = [];
    options.forEach((tool) => {
      const keys = Object.keys(tool);
      const containsText = keys.filter(
        (k) => tool[k].toString().toLowerCase().includes(text.toLowerCase()),
      );
      if (containsText.length > 0) {
        newFiltered.push(tool);
      }
    });
    setFilteredOptions(newFiltered);
    return newFiltered;
  };


  const renderMenuItem = (primaryText, secondaryText, key) => (
    <Menu.Item
      key={[key, 'item'].join('-')}
      onClick={() => {
        onSelect(key);
      }}
    >
      <div>
        <Text strong>{primaryText}</Text>
        <br />
        <Text type='secondary'>{secondaryText}</Text>
      </div>
    </Menu.Item>
  );

  const renderMenu = () => {
    if (filteredOptions.length > 0) {
      return (
        <Menu>
          {
            filteredOptions.map((t) => renderMenuItem(t.name, t.description, t.key))
          }
        </Menu>
      );
    }
    return (
      <Menu>
        {
          options.map((t) => renderMenuItem(t.name, t.description, t.key))
        }
      </Menu>
    );
  };

  const { placeholder } = props;

  return (
    <Dropdown
      overlay={renderMenu()}
      trigger={['click']}
    >
      <Input
        prefix={<PlusOutlined />}
        placeholder={placeholder}
        onChange={(e) => search(e.target.value)}
      />
    </Dropdown>
  );
};

SearchMenu.defaultProps = {
  onSelect: () => null,
};


SearchMenu.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelect: PropTypes.func,
  placeholder: PropTypes.string.isRequired,
};

export default SearchMenu;
