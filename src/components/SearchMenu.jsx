import React, { useState } from 'react';
import PropTypes from 'prop-types';


import {
  Input, Dropdown, Menu, Typography,
} from 'antd';

const { Search } = Input;
const { Text } = Typography;


const SearchMenu = (props) => {
  const { options } = props;
  const [filteredOptions, setFilteredOptions] = useState(options);

  const search = (text) => {
    const newFiltered = [];
    // todo: refactor this to search in values for each key, not have hardcoded key names
    options.forEach((tool) => {
      if (tool.name.toLowerCase().includes(text.toLowerCase())
        || tool.description.toLowerCase().includes(text.toLowerCase())) {
        newFiltered.push(tool);
      }
    });
    setFilteredOptions(newFiltered);
    return newFiltered;
  };


  const renderMenuItem = (primaryText, secondaryText, key) => (
    <Menu.Item
      key={key}
      onClick={() => {
        props.onSelect(key);
      }}
    >
      <div>
        <Text strong>{primaryText}</Text>
        <br />
        <Text type="secondary">{secondaryText}</Text>
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

  return (
    <Dropdown
      overlay={renderMenu()}
      trigger={['click']}
    >
      <Search placeholder="Search or browse tools..." onChange={(e) => search(e.target.value)} />
    </Dropdown>
  );
};

SearchMenu.defaultProps = {
  onSelect: () => null,
};


SearchMenu.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelect: PropTypes.func,
};

export default SearchMenu;
