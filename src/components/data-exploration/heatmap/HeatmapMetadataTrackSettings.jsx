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

import { updatePlotConfig } from 'redux/actions/componentConfig';
import { getCellSets, getCellSetsHierarchy } from 'redux/selectors';
import { ClipLoader } from 'react-spinners';
import colors from 'utils/styling/colors';
import ReorderableList from '../../ReorderableList';

const convertToReorderableListData = (cellClassKeys, selected, hierarchy) => (
  cellClassKeys.map((key) => {
    const { name } = _.find(hierarchy, ({ key: currentKey }) => currentKey === key);

    return {
      key, disabledReorder: !selected, name,
    };
  })
);

const HeatmapMetadataTrackSettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;

  const { accessible: cellSetsAccessible } = useSelector(getCellSets());
  const hierarchy = useSelector(getCellSetsHierarchy());

  const selectedTracks = useSelector(
    (state) => state.componentConfig[componentType]?.config?.selectedTracks,
    _.isEqual,
  );

  const [listData, setListData] = useState([]);

  useEffect(() => {
    if (hierarchy === null || _.isEmpty(hierarchy)) return;

    const selectedTracksListData = convertToReorderableListData(
      selectedTracks, true, hierarchy,
    );

    const unselectedTracks = _.difference(hierarchy.map(({ key }) => key), selectedTracks);
    const unselectedTracksListData = convertToReorderableListData(
      unselectedTracks, false, hierarchy,
    );

    setListData([...selectedTracksListData, ...unselectedTracksListData]);
  }, [selectedTracks, cellSetsAccessible]);

  const setTrackSelected = (selected, key) => {
    const newSelectedTracks = [...selectedTracks];

    if (selected) {
      newSelectedTracks.push(key);
    } else {
      _.pull(newSelectedTracks, key);
    }

    dispatch(
      updatePlotConfig(componentType, {
        selectedTracks: newSelectedTracks,
      }),
    );
  };

  const setTrackOrder = (reorderedTracks) => {
    const reorderedSelectedTrackKeys = reorderedTracks
      .filter(({ disabledReorder }) => !disabledReorder)
      .map(({ key }) => key);

    dispatch(
      updatePlotConfig(componentType, {
        selectedTracks: reorderedSelectedTrackKeys,
      }),
    );
  };

  const leftItem = (trackDataItem) => (
    <Switch
      checkedChildren={<EyeOutlined />}
      unCheckedChildren={<EyeInvisibleOutlined />}
      value={trackDataItem.key}
      checked={!trackDataItem.disabledReorder}
      onChange={(selected) => {
        setTrackSelected(selected, trackDataItem.key);
      }}
    />
  );

  const rightItem = (trackDataItem) => (
    hierarchy.filter((current) => current.key === trackDataItem.key)[0].name
  );

  return (
    <div style={{ padding: '5px' }}>
      {
        cellSetsAccessible
          ? (
            <ReorderableList
              onChange={setTrackOrder}
              listData={listData}
              leftItem={leftItem}
              rightItem={rightItem}
            />
          ) : <center><ClipLoader size={20} color={colors.darkRed} /></center>
      }
    </div>
  );
};

HeatmapMetadataTrackSettings.defaultProps = {
};

HeatmapMetadataTrackSettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default HeatmapMetadataTrackSettings;
