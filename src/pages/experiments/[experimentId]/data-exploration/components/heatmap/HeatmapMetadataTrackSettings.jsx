import React, { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  Button, Space, Switch,
} from 'antd';
import { updatePlotConfig } from '../../../../../../redux/actions/componentConfig';

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

  const moveUp = (source, id) => {
    const index = source.findIndex((e) => e.key === id);

    const arr = [...source];

    if (index <= 0) {
      return arr;
    }

    const el = arr[index];
    arr[index] = arr[index - 1];
    arr[index - 1] = el;

    return arr;
  };

  const moveDown = (source, id) => {
    const index = source.findIndex((e) => e.key === id);

    const arr = [...source];

    if (index === -1 || index >= source.length - 1) {
      return arr;
    }

    const el = arr[index];
    arr[index] = arr[index + 1];
    arr[index + 1] = el;

    return arr;
  };

  return (
    <div style={{ padding: '5px' }}>
      <Space direction='vertical'>
        {trackData.map(({ key, selected }, i) => (
          <Space>
            <Switch
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
              value={key}
              checked={selected}
              onChange={(state) => {
                const newState = [...trackData];
                newState[i].selected = state;
                setTrackData(newState);
              }}
            />

            <div>
              <Button
                size='small'
                icon={<UpOutlined />}
                shape='circle'
                disabled={i === 0}
                onClick={() => {
                  setTrackData(moveUp(trackData, key));
                }}
              />
              <Button
                size='small'
                shape='circle'
                disabled={i === trackData.length - 1}
                icon={<DownOutlined />}
                onClick={() => {
                  setTrackData(moveDown(trackData, key));
                }}
              />
            </div>

            {cellSets.properties[key].name}
          </Space>
        ))}
      </Space>
    </div>
  );
};

HeatmapMetadataTrackSettings.defaultProps = {
};

HeatmapMetadataTrackSettings.propTypes = {
};

export default HeatmapMetadataTrackSettings;
