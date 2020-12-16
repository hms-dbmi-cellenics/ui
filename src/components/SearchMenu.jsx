import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Input, Menu, Divider, Tooltip,
} from 'antd';

const SearchMenu = (props) => {
  const { options, categoryInfo, onSelect } = props;
  const [filteredOptions, setFilteredOptions] = useState(options);

  const search = (text) => {
    const newFiltered = {};
    Object.keys(options).forEach((key) => {
      newFiltered[key] = newFiltered[key] || [];
      options[key].forEach((tool) => {
        const keys = Object.keys(tool);
        const containsText = keys.filter(
          (k) => tool[k].toString().toLowerCase().includes(text.toLowerCase()),
        );
        if (containsText.length > 0) {
          newFiltered[key].push(tool);
        }
      });
    });

    setFilteredOptions(newFiltered);
    return newFiltered;
  };

  const renderMenuItem = (icon, item, category) => (
    <Menu.Item
      key={[item.key, 'item'].join('-')}
      icon={icon}
      onClick={() => {
        onSelect(item.key, category, item.group);
      }}
    >
      <Tooltip placement='left' title={item.description} mouseLeaveDelay={0}>
        {item.name ?? item.key}
      </Tooltip>
    </Menu.Item>
  );

  return (
    <Menu>
      <Menu.Item>
        <Input
          placeholder='Search'
          onChange={(e) => search(e.target.value)}
          allowClear
        />
      </Menu.Item>
      {
        Object.keys(filteredOptions).map((category) => [
          filteredOptions[category].length > 0 ? <Menu.Item><Divider orientation='left' plain>{category || ''}</Divider></Menu.Item> : <></>,
          filteredOptions[category].map((item) => renderMenuItem(categoryInfo[category] || <></>,
            item,
            category)),
        ])
      }
    </Menu>
  );
};

SearchMenu.defaultProps = {
  onSelect: () => null,
  categoryInfo: {},
};

SearchMenu.propTypes = {
  onSelect: PropTypes.func,
  options: PropTypes.objectOf(PropTypes.array).isRequired,
  categoryInfo: PropTypes.object,
};

export default SearchMenu;
