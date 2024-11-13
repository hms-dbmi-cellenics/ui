import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import {
  Switch,
  Space,
} from 'antd';

import { updatePlotConfig } from 'redux/actions/componentConfig';

const SpatialVisibleLayersSettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;
  const { showImages, showSegmentations } = useSelector((state) => state.componentConfig[componentType]);

  const [listData, setListData] = useState([]);

  const setLayerVisible = (visible, key) => {
    dispatch(
      updatePlotConfig(componentType, {
        [key]: visible,
      }),
    );
  };

  useEffect(() => {
    setListData([
      {
        key: 'showImages',
        name: 'Images',
        visible: showImages || true,
      },
      {
        key: 'showSegmentations',
        name: 'Segmentations',
        visible: showSegmentations || true,

      },
    ]);
  }, [showImages, showSegmentations]);

  const leftItem = (layerItem) => (
    <Switch
      checkedChildren={<EyeOutlined />}
      unCheckedChildren={<EyeInvisibleOutlined />}
      defaultChecked={layerItem.visible}
      value={layerItem.key}
      onChange={(selected) => {
        setLayerVisible(selected, layerItem.key);
      }}
    />
  );

  const rightItem = (layerItem) => (
    <span style={{ marginLeft: 10 }}>{layerItem.name}</span>
  );

  // This is so that a click on toggle doesn't close the menu
  const stopPropagationEvent = (e) => e.stopPropagation();

  const composeItem = (itemData, i) => (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      key={i}
      onClick={stopPropagationEvent}
    >
      {leftItem(itemData, i)}
      {rightItem(itemData, i)}
    </div>
  );

  return (
    <div style={{ padding: '5px' }}>
      <Space direction='vertical'>
        {listData.map((itemData, i) => composeItem(itemData, i))}
      </Space>
    </div>
  );
};

SpatialVisibleLayersSettings.defaultProps = {
};

SpatialVisibleLayersSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default SpatialVisibleLayersSettings;
