import React from 'react';
import {
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button, Dropdown, Tooltip,
} from 'antd';

import PropTypes from 'prop-types';
import SpatialVisibleLayersSettings from 'components/data-exploration/spatial/SpatialVisibleLayersSettings';
import SpatialGroupBySettings from 'components/data-exploration/spatial/SpatialGroupBySettings';

const SpatialSettings = (props) => {
  const { componentType } = props;

  const menuItems = [
    {
      label: 'Visible layers',
      key: 'visibleLayers',
      children: [
        {
          label: (<SpatialVisibleLayersSettings componentType={componentType} />),
          key: 'visibleLayersChild',
        },
      ],
    },
    {
      label: 'Group images by',
      key: 'groupBy',
      children: [
        {
          label: (<SpatialGroupBySettings componentType={componentType} />),
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

SpatialSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default SpatialSettings;
