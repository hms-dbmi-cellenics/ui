import React from 'react';
import {
  Dropdown, Button, Menu, Slider,
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const OpacityDropdown = (props) => {
  const { opacity, setOpacity } = props;

  // Create a menu with a slider to adjust opacity
  const menu = (
    <Menu>
      <Menu.Item key='slider'>
        <div>
          <span>
            Opacity:
          </span>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={setOpacity}
            style={{ width: '150px' }}
          />
        </div>
      </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <Dropdown overlay={menu} trigger={['click']}>
        <Button
          icon={<SettingOutlined />}
          type='text'
          className='bp3-button bp3-minimal'
        />
      </Dropdown>
    </div>
  );
};

export default OpacityDropdown;
