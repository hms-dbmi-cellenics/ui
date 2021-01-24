import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import { updatePlotConfig } from '../../../../../../redux/actions/componentConfig';
import {
  PlusOutlined,
  MinusOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import {
  Button, Space, Menu, Dropdown
} from 'antd';

const HeatmapGroupBySettings = () => {
  const dispatch = useDispatch();
  const groupedTracksKeys = useSelector((state) => state.componentConfig.interactiveHeatmap.config.groupedTracks);
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

  const getCellSetsOrder = () => {
    const allCellSetsGroupBys = getCellSets(['cellSets', 'metadataCategorical']);

    let groupedCellSets = [];

    // from the enabled cell sets keys we get, find their corresponding information
    groupedTracksKeys
      .forEach((trackKey) => {
        const groupBy = allCellSetsGroupBys.find((cellSetGroupBy) => cellSetGroupBy.key === trackKey);
        groupedCellSets.push(groupBy);
      });

    // About the filtering: If we have failed to find some of the groupbys information, 
    // then ignore those (this is useful for groupbys that sometimes dont show up, like 'samples')
    return groupedCellSets.filter((groupedCellSet) => groupedCellSet !== undefined);
  };

  const isInitialRenderRef = useRef(true);
  const [cellSetsOrder, setCellSetsOrder] = useState(getCellSetsOrder());

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;

      return;
    }

    if (cellSetsOrder.length === 0) {
      return;
    }

    dispatch(
      updatePlotConfig('interactiveHeatmap', {
        groupedTracks: cellSetsOrder.map((cellSet) => cellSet.key)
      })
    );
  }, [cellSetsOrder]);

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

  const indexOfCellSet = (cellSet) => {
    return cellSetsOrder.findIndex((elem) => (elem.key === cellSet.key));
  }

  const menu = (
    <Menu>
      {
        getCellSets(['cellSets', 'metadataCategorical'])
          .map((cellSet) => {
            let positionInCellSetOrder = indexOfCellSet(cellSet);

            return (
              <Menu.Item size='small'>
                <div style={{ margin: '0px', width: '100%' }} onClick={(e) => { e.stopPropagation(); }}>
                  <Button
                    shape="square"
                    size='small'
                    style={{ marginRight: '5px' }}
                    icon={positionInCellSetOrder > -1 ? <MinusOutlined /> : <PlusOutlined />}
                    onClick={() => {
                      let newCellSetsOrder = [...cellSetsOrder];
                      if (positionInCellSetOrder > -1) {
                        // If the cell is included in the cellSet, we have to remove it
                        newCellSetsOrder.splice(positionInCellSetOrder, 1);
                      } else {
                        // If the cell is not included in the cellSet, we have to add it
                        newCellSetsOrder.push(cellSet);
                      }

                      setCellSetsOrder(newCellSetsOrder);
                    }}
                  >
                  </Button>
                  {cellSet.name}
                </div>
              </Menu.Item>
            );
          })
      }
    </Menu>
  );

  return (
    <div style={{ padding: '5px' }}>
      <Space direction='vertical'>
        <Dropdown overlay={menu}>
          <div style={{ padding: '7px', border: '1px solid rgb(238,238,238)' }}>
            Select the parameters to group by
            <DownOutlined style={{ marginLeft: '5px' }} />
          </div>
        </Dropdown>

        {
          cellSetsOrder.map((cellSet, i) => (
            <div>
              <Button
                size='small'
                icon={<UpOutlined />}
                shape='circle'
                disabled={i === 0}
                onClick={() => {
                  setCellSetsOrder(moveUp(cellSetsOrder, cellSet.key));
                }}
              />

              <Button
                size='small'
                shape='circle'
                disabled={i === cellSetsOrder.length - 1}
                icon={<DownOutlined />}
                onClick={() => {
                  setCellSetsOrder(moveDown(cellSetsOrder, cellSet.key));
                }}
                style={{ marginRight: '5px' }}
              />

              {cellSet.name}
            </div>
          ))
        }
      </Space>
    </div >
  );

};

HeatmapGroupBySettings.defaultProps = {
};

HeatmapGroupBySettings.propTypes = {
};

export default HeatmapGroupBySettings;