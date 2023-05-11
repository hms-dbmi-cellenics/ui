import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  PlusOutlined,
  MinusOutlined,
  DownOutlined,
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import {
  Button, Space, Menu, Dropdown,
} from 'antd';
import PropTypes from 'prop-types';
import { ClipLoader } from 'react-spinners';
import _ from 'lodash';

import { updatePlotConfig } from 'redux/actions/componentConfig';
import { getCellSets, getCellSetsHierarchy } from 'redux/selectors';

import ReorderableList from 'components/ReorderableList';
import colors from 'utils/styling/colors';

const HeatmapGroupBySettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;

  const groupedTracksKeys = useSelector(
    (state) => state.componentConfig[componentType].config.groupedTracks,
  );
  const { accessible: cellSetsAccessible } = useSelector(getCellSets());
  const allCellSetsGroupBys = useSelector(getCellSetsHierarchy());

  const getCellSetsOrder = () => {
    const groupedCellSets = [];

    // from the enabled cell sets keys we get, find their corresponding information
    groupedTracksKeys
      .forEach((trackKey) => {
        const groupBy = allCellSetsGroupBys
          .find((cellSetGroupBy) => cellSetGroupBy.key === trackKey);

        groupedCellSets.push(groupBy);
      });

    // About the filtering: If we have failed to find some of the groupbys information,
    // then ignore those (this is useful for groupbys that sometimes dont show up, like 'samples')
    return groupedCellSets.filter((groupedCellSet) => groupedCellSet !== undefined);
  };

  const isInitialRenderRef = useRef(true);
  const [cellSetsOrder, setCellSetsOrder] = useState(getCellSetsOrder());
  const previousGroupedKeys = () => cellSetsOrder.map((cellSet) => cellSet.key);

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    if (cellSetsOrder.length === 0) {
      return;
    }

    dispatch(
      updatePlotConfig(componentType, {
        groupedTracks: cellSetsOrder.map((cellSet) => cellSet.key),
      }),
    );
  }, [cellSetsOrder]);

  useEffect(() => {
    if (!cellSetsAccessible) return;

    if (!_.isEqual(previousGroupedKeys(), groupedTracksKeys)) {
      const newOrder = getCellSetsOrder();
      setCellSetsOrder(newOrder);
    }
  }, [groupedTracksKeys, cellSetsAccessible]);
  const indexOfCellSet = (cellSet) => cellSetsOrder.findIndex((elem) => (elem.key === cellSet.key));

  // This is so that a click on + or - buttons doesn't close the menu
  const stopPropagationEvent = (e) => e.stopPropagation();
  const menu = (
    <Menu>
      {
        allCellSetsGroupBys
          .map((cellSet, indx) => {
            const positionInCellSetOrder = indexOfCellSet(cellSet);

            return (
              // eslint-disable-next-line react/no-array-index-key
              <Menu.Item key={indx} size='small'>
                <div onClick={stopPropagationEvent} onKeyDown={stopPropagationEvent}>
                  <Button
                    shape='square'
                    size='small'
                    style={{ marginRight: '5px' }}
                    icon={positionInCellSetOrder > -1 ? <MinusOutlined /> : <PlusOutlined />}
                    onClick={() => {
                      const newCellSetsOrder = [...cellSetsOrder];
                      if (positionInCellSetOrder > -1) {
                        // If the cell is included in the cellSet, we have to remove it
                        newCellSetsOrder.splice(positionInCellSetOrder, 1);
                      } else {
                        // If the cell is not included in the cellSet, we have to add it
                        newCellSetsOrder.push(cellSet);
                      }
                      setCellSetsOrder(newCellSetsOrder);
                    }}
                  />
                  {cellSet.name}
                </div>
              </Menu.Item>
            );
          })
      }
    </Menu>
  );

  return (
    <div style={{ padding: '5px' }} key='dropdown'>
      <Space direction='vertical'>
        <Dropdown overlay={menu} trigger='click hover'>
          <div style={{ padding: '7px', border: '1px solid rgb(238,238,238)' }}>
            Select the parameters to group by
            <DownOutlined style={{ marginLeft: '5px' }} />
          </div>
        </Dropdown>

        {cellSetsAccessible
          ? (
            <ReorderableList
              onChange={setCellSetsOrder}
              listData={cellSetsOrder}
              rightItem={(cellSet) => cellSet.name}
            />
          ) : <center><ClipLoader size={20} color={colors.darkRed} /></center>}
      </Space>
    </div>
  );
};

HeatmapGroupBySettings.defaultProps = {
};

HeatmapGroupBySettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default HeatmapGroupBySettings;
