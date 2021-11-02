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
import HeatmapExpressionValuesSettings from 'components/data-exploration/heatmap/HeatmapExpressionValuesSettings';
import HeatmapLegendVisibilitySettings from 'components/data-exploration/heatmap/HeatmapLegendVisibilitySettings';

const { SubMenu } = Menu;

const HeatmapSettings = (props) => {
  const { componentType } = props;

  const renderMenu = () => (
    <Menu size='small'>
      <SubMenu key='expression-values' title='Expression values' icon={<></>}>
        <HeatmapExpressionValuesSettings componentType={componentType} />
      </SubMenu>
      <SubMenu key='legend' title='Legend' icon={<></>}>
        <HeatmapLegendVisibilitySettings componentType={componentType} />
      </SubMenu>
      <SubMenu key='metadata-tracks' title='Metadata tracks...' icon={<></>}>
        <HeatmapMetadataTrackSettings componentType={componentType} />
      </SubMenu>
      <SubMenu key='group-by' title='Group by' icon={<></>}>
        <HeatmapGroupBySettings componentType={componentType} />
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
