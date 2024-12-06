import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Switch, Space,
} from 'antd';

import { updatePlotConfig } from 'redux/actions/componentConfig';
import { getCellSets, getCellSetsHierarchyByType, getGroupSlidesBy } from 'redux/selectors';
import { ClipLoader } from 'react-spinners';
import colors from 'utils/styling/colors';

const convertToListData = (hierarchy, selectedKeys) => (
  hierarchy.map(({ key, name }) => ({
    key,
    name,
    selected: selectedKeys.includes(key),
  }))
);

const SpatialGroupBySettings = (props) => {
  const dispatch = useDispatch();
  const { componentType } = props;

  const { accessible: cellSetsAccessible } = useSelector(getCellSets());
  const hierarchy = useSelector(getCellSetsHierarchyByType('metadataCategorical'));
  const groupSlidesBy = useSelector(getGroupSlidesBy(componentType));

  const [listData, setListData] = useState([]);

  useEffect(() => {
    if (!hierarchy || _.isEmpty(hierarchy)) return;

    // Initialize listData based on hierarchy order
    setListData(convertToListData(hierarchy, groupSlidesBy));
  }, [hierarchy, groupSlidesBy]);

  const setGroupSlidesBy = (selectedKey) => {
    const newListData = listData.map((item) => ({
      ...item,
      selected: item.key === selectedKey,
    }));

    setListData(newListData);

    // Update only with the newly selected key (or empty array if none)
    dispatch(
      updatePlotConfig(componentType, {
        groupSlidesBy: selectedKey ? [selectedKey] : [],
      }),
    );
  };

  const leftItem = (listDataItem) => (
    <Switch
      disabled
      checked={listDataItem.selected}
      onChange={() => {
        setGroupSlidesBy(listDataItem.key);
      }}
    />
  );

  const rightItem = (listDataItem) => (
    <span style={{ marginLeft: 10 }}>
      {listDataItem.name}
    </span>
  );

  const composeItem = (itemData) => (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      key={itemData.key}
      onClick={(e) => e.stopPropagation()}
    >
      {leftItem(itemData)}
      {rightItem(itemData)}
    </div>
  );

  return (
    <div style={{ padding: '5px' }}>
      {cellSetsAccessible ? (
        <Space direction='vertical'>
          {listData.map((itemData) => composeItem(itemData))}
        </Space>
      ) : (
        <center>
          <ClipLoader size={20} color={colors.darkRed} />
        </center>
      )}
    </div>
  );
};

SpatialGroupBySettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default SpatialGroupBySettings;
