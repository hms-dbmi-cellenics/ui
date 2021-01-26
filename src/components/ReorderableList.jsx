import React from 'react';
import PropTypes from 'prop-types';

import { Button, Space } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

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

const ReorderableList = (props) => {
  const {
    onMoveUp, onMoveDown, reorderableList, leftItem, rightItem,
  } = props;

  const upButton = (key, currentPosition) => (
    <Button
      size='small'
      shape='circle'
      disabled={currentPosition === 0}
      icon={<UpOutlined />}
      style={{ marginLeft: '5px' }}
      onClick={() => {
        onMoveUp(moveUp(reorderableList, key));
      }}
    />
  );

  const downButton = (key, currentPosition) => (
    <Button
      size='small'
      shape='circle'
      disabled={currentPosition === reorderableList.length - 1}
      icon={<DownOutlined />}
      style={{ marginRight: '5px' }}
      onClick={() => {
        onMoveDown(moveDown(reorderableList, key));
      }}
    />
  );

  const fullItem = (listItem, i) => (
    <div>
      {leftItem(listItem, i)}

      {upButton(listItem.key, i)}
      {downButton(listItem.key, i)}

      {rightItem(listItem, i)}
    </div>
  );

  return (
    <Space direction='vertical'>
      {reorderableList.map((listItem, i) => (
        fullItem(listItem, i)
      ))}
    </Space>
  );
};

ReorderableList.propTypes = {
  onMoveUp: PropTypes.node.isRequired,
  onMoveDown: PropTypes.node.isRequired,
  reorderableList: PropTypes.node.isRequired,
  leftItem: () => { },
  rightItem: () => { },
};

ReorderableList.defaultProps = {
  leftItem: () => { },
  rightItem: () => { },
};

export default ReorderableList;
