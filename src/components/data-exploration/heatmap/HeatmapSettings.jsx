import React from 'react';
import {
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button, Dropdown, Menu, Tooltip,
} from 'antd';

import PropTypes from 'prop-types';
import HeatmapMetadataTrackSettings from 'components/data-exploration/heatmap/HeatmapMetadataTrackSettings';
import HeatmapGroupBySettings from 'components/data-exploration/heatmap/HeatmapGroupBySettings';

import NoStyleAntdMenuItem from 'components/NoStyleAntdMenuItem';
import styles from 'utils/css/no-style-menu-item.module.css';

const { SubMenu } = Menu;

const HeatmapSettings = (props) => {
  const { componentType } = props;

  const renderMenu = () => (
    <Menu size='small'>
      <SubMenu key='metadataTracks' title='Metadata tracks' icon={<></>} popupClassName={styles['no-style-menu-item']}>
        <NoStyleAntdMenuItem>
          <HeatmapMetadataTrackSettings componentType={componentType} />
        </NoStyleAntdMenuItem>
      </SubMenu>
      <SubMenu key='groupBy' title='Group by' icon={<></>}>
        <NoStyleAntdMenuItem>
          <HeatmapGroupBySettings componentType={componentType} />
        </NoStyleAntdMenuItem>
      </SubMenu>
    </Menu>
  );

  return (
    <Dropdown arrow type='link' size='small' overlay={renderMenu()} trigger={['click']}>
      <Tooltip title='Settings'>
        <Button
          type='text'
          icon={<SettingOutlined />}
          // these classes are added so that the settings button
          // is the same style as the remove button
          className='bp3-button bp3-minimal'
        />
      </Tooltip>
    </Dropdown>
  );
};

HeatmapSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default HeatmapSettings;
