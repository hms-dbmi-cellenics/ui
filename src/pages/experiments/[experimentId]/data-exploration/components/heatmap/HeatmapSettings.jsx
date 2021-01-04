import React, { useRef } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import {
  SettingOutlined,
  GroupOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  Button, Dropdown, Menu, Tooltip, Transfer, Space, Typography,
} from 'antd';
import { updateCellInfo } from '../../../../../../redux/actions/cellInfo';

const { Text } = Typography;
const { SubMenu, Item } = Menu;

const HeatmapSettings = () => {
  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const targetKeys = useSelector((state) => state.cellInfo.selectedTracks);
  const groupedTrack = useSelector((state) => state.cellInfo.groupedTrack);

  const upButtonRef = useRef(null);
  const downButtonRef = useRef(null);
  const groupButtonRef = useRef(null);

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

  const onChange = (nextTargetKeys) => {
    dispatch(
      updateCellInfo(
        {
          selectedTracks: _.reverse(nextTargetKeys),
        },
      ),
    );
  };

  const moveUp = (source, id) => {
    const index = source.findIndex((e) => e === id);

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
    const index = source.findIndex((e) => e === id);

    const arr = [...source];

    if (index === -1 || index >= source.length - 1) {
      return arr;
    }

    const el = arr[index];
    arr[index] = arr[index + 1];
    arr[index + 1] = el;

    return arr;
  };

  const renderTransferLabel = (data) => {
    let extraButtons = <></>;

    if (targetKeys.includes(data.key)) {
      extraButtons = (
        <>
          <Button
            size='small'
            icon={<UpOutlined />}
            ref={upButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              upButtonRef.current.blur();

              // TODO: we need to make sure deleted cell sets get removed from this list automatically.
              dispatch(
                updateCellInfo(
                  {
                    selectedTracks: moveUp(targetKeys, data.key),
                  },
                ),
              );
            }}
          />
          <Button
            size='small'
            icon={<DownOutlined />}
            ref={downButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              downButtonRef.current.blur();

              // TODO: we need to make sure deleted cell sets get removed from this list automatically.
              dispatch(
                updateCellInfo(
                  {
                    selectedTracks: moveDown(targetKeys, data.key),
                  },
                ),
              );
            }}
          />
        </>
      );
    }
    let tooltipTitle = 'Group cells by track';

    if (groupedTrack === data.key) {
      tooltipTitle = 'Currently grouped by this track';
    }

    return (
      <Space>
        {extraButtons}
        <Tooltip title={tooltipTitle}>
          <Button
            size='small'
            ref={groupButtonRef}
            disabled={groupedTrack === data.key}
            icon={<GroupOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              groupButtonRef.current.blur();

              // TODO: we need to make sure deleted cell sets get removed from this list automatically.
              dispatch(
                updateCellInfo(
                  {
                    groupedTrack: data.key,
                  },
                ),
              );
            }}
          />
        </Tooltip>
        {data.name}
      </Space>
    );
  };

  const renderEmptyState = () => {
    const text = (
      <>
        <Text>
          No tracks
          {' '}
          {targetKeys.length === 0 ? 'shown' : 'hidden'}
          .
        </Text>
        <br />
        <Text type='secondary'>
          Select
          {' '}
          {targetKeys.length === 0 ? 'hidden' : 'shown'}
          {' '}
          tracks
          {' '}
          <br />
          and click
          {' '}
          {targetKeys.length === 0 ? '>' : '<'}
          {' '}
          to
          <br />
          move them here.
        </Text>
      </>
    );

    return {
      notFoundContent: text,
    };
  };

  const renderMenu = () => {
    const dataSource = getCellSets(['cellSets', 'metadataCategorical']);

    return (
      <Menu size='small'>
        <Item key='toggle-legend' disabled>
          Expression values...
        </Item>
        <Item key='toggle-legend' disabled>
          Hide legend
        </Item>
        <SubMenu key='metadata-tracks' title='Metadata tracks...' icon={<></>}>
          <div>
            <Transfer
              dataSource={dataSource}
              locale={renderEmptyState(targetKeys)}
              render={renderTransferLabel}
              listStyle={{
                width: 'auto',
                height: 'auto',
              }}
              titles={['Hidden', 'Shown']}
              targetKeys={targetKeys}
              onChange={onChange}
            />
          </div>
        </SubMenu>

      </Menu>
    );
  };

  return (
    <Dropdown arrow type='link' size='small' overlay={renderMenu()} trigger={['click']}>
      <Tooltip title='Settings'>
        <Button
          size='small'
          type='text'
          icon={<SettingOutlined />}
          // these classes are added so that the settings button is the same style as the remove button
          className='bp3-button bp3-minimal'
        />
      </Tooltip>
    </Dropdown>
  );
};

HeatmapSettings.defaultProps = {
};

HeatmapSettings.propTypes = {
};

export default HeatmapSettings;

/**
 *       <SubMenu key='metadata-label' title='Metadata label'>
              <Checkbox.Group>
                {getCellSets(['metadataCategorical']).map((element) => (
                  <Checkbox style={radioStyle} onClick={(e) => checkBoxChecked(e, element.value)}>{element.value}</Checkbox>
                ))}
              </Checkbox.Group>
            </SubMenu>
            <SubMenu key='legend' title='Legend'>
              <Radio.Group value={showLegend} onChange={changelegend}>
                <Radio key='1' style={radioStyle} value>Show</Radio>
                <Radio key='2' style={radioStyle} value={false}>Hide</Radio>
              </Radio.Group>
            </SubMenu>
            <SubMenu key='group-by' title='Group by'>
              <Menu.ItemGroup>
                <Radio.Group value={groupBy} onChange={changeGroupBy}>
                  {getCellSets(['metadataCategorical', 'cellSets']).map((element) => (
                    <Radio style={radioStyle} key={element.value} value={element.value}>{element.value}</Radio>
                  ))}
                </Radio.Group>
              </Menu.ItemGroup>
            </SubMenu>
 */
