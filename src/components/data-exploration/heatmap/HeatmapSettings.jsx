import React from 'react';
import {
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button, Dropdown, Tooltip,
} from 'antd';

import PropTypes from 'prop-types';
import HeatmapMetadataTrackSettings from 'components/data-exploration/heatmap/HeatmapMetadataTrackSettings';
import HeatmapGroupBySettings from 'components/data-exploration/heatmap/HeatmapGroupBySettings';

const HeatmapSettings = (props) => {
  const { componentType } = props;

  const menuItems = [
    {
      label: 'Metadata tracks',
      key: 'metadataTracks',
      children: [
        {
          label: (<HeatmapMetadataTrackSettings componentType={componentType} />),
          key: 'metadataTracksChild',
        },
      ],
    },
    {
      label: 'Group by',
      key: 'groupBy',
      children: [
        {
          label: (<HeatmapGroupBySettings componentType={componentType} />),
          key: 'groupByChild',
        },
      ],
    },
  ];

  return (
    <>
      <Dropdown
        arrow
        type='link'
        size='small'
        menu={{ items: menuItems }}
        trigger={['click']}
      >
        <Tooltip title='Settings'>
          <Button
            type='text'
            icon={<SettingOutlined />}
            className='bp3-button bp3-minimal'
          />
        </Tooltip>
      </Dropdown>
    </>
  );
};

HeatmapSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default HeatmapSettings;
