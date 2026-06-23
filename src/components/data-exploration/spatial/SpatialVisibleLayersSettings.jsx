import React, { useEffect, useState } from 'react';
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
import { imagelessTechs } from 'utils/constants';

const SpatialVisibleLayersSettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;
  const {
    showImages,
    showSegmentations,
    showSegmentationOutlines,
    showMolecules,
  } = useSelector((state) => state.componentConfig[componentType].config);

  // imageless techs (e.g. Xenium) have no tissue image, so the Images toggle
  // would control a layer that never renders — hide it for those technologies.
  // The molecule overlay is likewise a Xenium-only feature.
  const sampleIds = useSelector((state) => state.experimentSettings.info.sampleIds);
  const technology = useSelector((state) => state.samples?.[sampleIds?.[0]]?.type);
  const isImageless = imagelessTechs.includes(technology);

  const [listData, setListData] = useState([]);

  const setLayerVisible = (visible, key) => {
    dispatch(updatePlotConfig(componentType, { [key]: visible }));
  };

  useEffect(() => {
    setListData([
      ...(isImageless ? [] : [{
        key: 'showImages',
        name: 'Images',
        visible: showImages !== false,
      }]),
      {
        key: 'showSegmentations',
        name: 'Segmentations',
        visible: showSegmentations !== false,
      },
      {
        key: 'showSegmentationOutlines',
        name: 'Outlines',
        visible: showSegmentationOutlines === true,
      },
      // Molecules overlay (Xenium only): when on AND a gene is being plotted, the
      // focused gene's transcripts render as points in place of the per-cell fill.
      // With a categorical focus or no pyramid it simply does nothing.
      ...(isImageless ? [{
        key: 'showMolecules',
        name: 'Molecules',
        visible: showMolecules === true,
      }] : []),
    ]);
  }, [showImages, showSegmentations, showSegmentationOutlines, showMolecules, isImageless]);

  const leftItem = (layerItem) => (
    <Switch
      checkedChildren={<EyeOutlined />}
      unCheckedChildren={<EyeInvisibleOutlined />}
      checked={layerItem.visible}
      onChange={(checked) => setLayerVisible(checked, layerItem.key)}
    />
  );

  const rightItem = (layerItem) => (
    <span style={{ marginLeft: 10 }}>{layerItem.name}</span>
  );

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

SpatialVisibleLayersSettings.defaultProps = {};

SpatialVisibleLayersSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default SpatialVisibleLayersSettings;
