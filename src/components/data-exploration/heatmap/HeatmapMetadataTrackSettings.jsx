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
} from 'antd';

import useLazyEffect from 'utils/customHooks/useLazyEffect';
import { updatePlotConfig } from '../../../redux/actions/componentConfig';
import ReorderableList from '../../ReorderableList';
import { getCellSetsHierarchy } from '../../../redux/selectors';

const HeatmapMetadataTrackSettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;
  const selectedHierarchy = useSelector(getCellSetsHierarchy());

  const selectedTracks = useSelector(
    (state) => state.componentConfig[componentType].config.selectedTracks,
  );

  const getTrackData = () => selectedHierarchy.map(
    (data) => ({ selected: selectedTracks.includes(data.key), key: data.key }),
  );

  const [trackData, setTrackData] = useState(getTrackData());

  const getUpdatedTrackData = () => _.unionBy(
    getTrackData(),
    trackData,
    'key',
  );

  useLazyEffect(() => {
    const newTrackData = getUpdatedTrackData();
    if (_.isEqual(trackData, newTrackData)) return;

    setTrackData(newTrackData);
  }, [selectedHierarchy]);

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
    if (_.isEqual(getEnabledTracks(), selectedTracks)) {
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
    selectedHierarchy.filter((current) => current.key === trackDataItem.key)[0].name
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
