import React, { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import {
  Switch,
} from 'antd';

import { updatePlotConfig } from '../../../../../../redux/actions/componentConfig';
import ReorderableList from '../../../../../../components/ReorderableList';

const HeatmapMetadataTrackSettings = () => {
  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const selectedTracks = useSelector(
    (state) => state.componentConfig.interactiveHeatmap.config.selectedTracks,
  );

  const getCellSets = (category) => {
    if (!cellSets || cellSets.loading) {
      return [];
    }

    return cellSets.hierarchy.map(
      ({ key }) => (
        { key, name: cellSets.properties[key].name, type: cellSets.properties[key].type }
      ),
    ).filter(
      ({ type }) => category.includes(type),
    );
  };

  const getTrackData = () => getCellSets(
    ['cellSets', 'metadataCategorical'],
  ).map(
    (data) => ({ selected: selectedTracks.includes(data.key), key: data.key }),
  );

  const isInitialRenderRef = useRef(true);
  const [trackData, setTrackData] = useState(getTrackData());

  const getUpdatedTrackData = () => _.unionBy(
    trackData,
    getTrackData(),
    'key',
  );

  useEffect(() => {
    // Prevent initial dispatch when object appears
    if (isInitialRenderRef.current) {
      return;
    }

    setTrackData(getUpdatedTrackData());
  }, [cellSets.hierarchy]);

  useEffect(() => {
    // Prevent initial dispatch when object appears
    if (isInitialRenderRef.current) {
      return;
    }

    if (trackData.length === 0) {
      return;
    }

    dispatch(
      updatePlotConfig('interactiveHeatmap', {
        selectedTracks: trackData.filter((o) => o.selected).map((o) => o.key),
      }),
    );
  }, [trackData]);

  useEffect(() => {
    isInitialRenderRef.current = false;
  });

  const leftItem = (trackDataItem, i) => (
    <Switch
      checkedChildren={<EyeOutlined />}
      unCheckedChildren={<EyeInvisibleOutlined />}
      value={trackDataItem.key}
      checked={trackDataItem.selected}
      onChange={(state) => {
        const newState = [...trackData];
        newState[i].selected = state;
        setTrackData(newState);
      }}
    />
  );

  const rightItem = (trackDataItem) => (
    cellSets.properties[trackDataItem.key].name
  );

  return (
    <div style={{ padding: '5px' }}>
      <ReorderableList
        onMoveUp={setTrackData}
        onMoveDown={setTrackData}
        reorderableList={trackData}
        leftItem={leftItem}
        rightItem={rightItem}
      />
    </div>
  );
};

HeatmapMetadataTrackSettings.defaultProps = {
};

HeatmapMetadataTrackSettings.propTypes = {
};

export default HeatmapMetadataTrackSettings;
