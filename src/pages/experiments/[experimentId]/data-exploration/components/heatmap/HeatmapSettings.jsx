import React from 'react';
import {
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button, Dropdown, Menu, Tooltip,
} from 'antd';
import PropTypes from 'prop-types';
import HeatmapMetadataTrackSettings from './HeatmapMetadataTrackSettings';
import HeatmapGroupBySettings from './HeatmapGroupBySettings';
import HeatmapExpressionValuesSettings from './HeatmapExpressionValuesSettings';

const { SubMenu, Item } = Menu;

const HeatmapSettings = (props) => {
  const {
    experimentId,
  } = props;

  const renderMenu = () => (
    <Menu size='small'>
      <SubMenu key='expression-values' title='Expression values' icon={<></>}>
        <HeatmapExpressionValuesSettings experimentId={experimentId} />
      </SubMenu>
      <Item key='toggle-legend' disabled>
        Hide legend
      </Item>
      <SubMenu key='metadata-tracks' title='Metadata tracks' icon={<></>}>
        <HeatmapMetadataTrackSettings />
      </SubMenu>
      <SubMenu key='group-by' title='Group by' icon={<></>}>
        <HeatmapGroupBySettings />
      </SubMenu>

    </Menu>
  );

  return (
    <Dropdown arrow type='link' size='small' overlay={renderMenu()} trigger={['click']}>
      <Tooltip title='Settings'>
        <Button
          size='small'
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

HeatmapSettings.defaultProps = {
};

HeatmapSettings.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default HeatmapSettings;
