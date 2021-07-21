import React, { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import {
  Switch,
} from 'antd';

import ReorderableList from '../../ReorderableList';

const MetadataTracksDisplayEditor = (props) => {
  const { onUpdate, config } = props;

  const { selectedTracks } = config;

  const cellSets = useSelector((state) => state.cellSets);

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

  const [trackData, setTrackData] = useState(getTrackData());

  const getUpdatedTrackData = () => _.unionBy(
    trackData,
    getTrackData(),
    'key',
  );

  useEffect(() => {
    setTrackData(getUpdatedTrackData());
  }, [cellSets.hierarchy]);

  useEffect(() => {
    onUpdate({ selectedTracks: trackData.filter((o) => o.selected).map((o) => o.key) });
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

MetadataTracksDisplayEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default MetadataTracksDisplayEditor;
