import React, { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import {
  Switch,
} from 'antd';

import { updatePlotConfig } from '../../../redux/actions/componentConfig';
import ReorderableList from '../../ReorderableList';

const HeatmapMetadataTrackSettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;

  const cellSets = useSelector((state) => state.cellSets);
  const selectedTracks = useSelector(
    (state) => state.componentConfig[componentType].config.selectedTracks,
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
    getTrackData(),
    trackData,
    'key',
  );

  useEffect(() => {
    // Prevent initial dispatch when object appears
    if (isInitialRenderRef.current) {
      return;
    }

    // Do not re-render if visible track data hasn't changed
    const newTrackData = getUpdatedTrackData();
    if (_.isEqual(trackData, newTrackData)) return;

    setTrackData(getUpdatedTrackData());
  }, [cellSets.hierarchy]);

  const getEnabledTracks = () => trackData.filter((entry) => entry.selected).map((o) => o.key);

  useEffect(() => {
    if (!_.isEqual(getEnabledTracks(), selectedTracks)) {
      const newTracks = trackData.map((entry) => {
        if (!selectedTracks.includes(entry.key)) {
          return { ...entry, selected: false };
        }
        return { ...entry, selected: true };
      });
      setTrackData(newTracks);
    }
  }, [selectedTracks]);

  useEffect(() => {
    // Prevent initial dispatch when object appears
    if (isInitialRenderRef.current || _.isEqual(getEnabledTracks(), selectedTracks)) {
      return;
    }
    if (trackData.length === 0) {
      return;
    }
    dispatch(
      updatePlotConfig(componentType, {
        selectedTracks: getEnabledTracks(),
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
        onChange={setTrackData}
        listData={trackData}
        leftItem={leftItem}
        rightItem={rightItem}
      />
    </div>
  );
};

HeatmapMetadataTrackSettings.defaultProps = {
};

HeatmapMetadataTrackSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default HeatmapMetadataTrackSettings;
