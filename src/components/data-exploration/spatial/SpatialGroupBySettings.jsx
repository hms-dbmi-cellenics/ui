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
import { getCellSets, getCellSetsHierarchyByType, getGroupSlidesBy } from 'redux/selectors';
import { ClipLoader } from 'react-spinners';
import colors from 'utils/styling/colors';
import SelectableList from './SelectableList';

const convertToReorderableListData = (cellClassKeys, selected, hierarchy) => (
  cellClassKeys.map((key) => {
    const { name } = _.find(hierarchy, ({ key: currentKey }) => currentKey === key);

    return {
      key, disabledReorder: !selected, name,
    };
  })
);

const SpatialGroupBySettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;

  const { accessible: cellSetsAccessible } = useSelector(getCellSets());
  const hierarchy = useSelector(getCellSetsHierarchyByType('metadataCategorical'));

  const groupSlidesBy = useSelector(getGroupSlidesBy(componentType));

  const [listData, setListData] = useState([]);

  useEffect(() => {
    if (hierarchy === null || _.isEmpty(hierarchy)) return;

    const groupSlidesByListData = convertToReorderableListData(
      groupSlidesBy, true, hierarchy,
    );

    const unselectedGroupSlidesBy = _.difference(hierarchy.map(({ key }) => key), groupSlidesBy);
    const unselectedGroupSlidesByListData = convertToReorderableListData(
      unselectedGroupSlidesBy, false, hierarchy,
    );

    setListData([...groupSlidesByListData, ...unselectedGroupSlidesByListData]);
  }, [groupSlidesBy, cellSetsAccessible]);

  const setGroupSlidesBy = (selected, key) => {
    // console.log('selected!!!');
    // console.log(selected);
  };

  const setTrackOrder = (reorderedTracks) => {
    // console.log('reorderedTracks!!!');
    // console.log(reorderedTracks);
  };

  const leftItem = (trackDataItem) => (
    <Switch
      checkedChildren={<EyeOutlined />}
      unCheckedChildren={<EyeInvisibleOutlined />}
      value={trackDataItem.key}
      checked={!trackDataItem.disabledReorder}
      onChange={(selected) => {
        setGroupSlidesBy(selected, trackDataItem.key);
      }}
    />
  );

  const rightItem = (trackDataItem) => (
    hierarchy.filter((current) => current.key === trackDataItem.key)[0]?.name
  );

  return (
    <div style={{ padding: '5px' }}>
      {
        cellSetsAccessible
          ? (
            <SelectableList
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

SpatialGroupBySettings.defaultProps = {
};

SpatialGroupBySettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default SpatialGroupBySettings;
