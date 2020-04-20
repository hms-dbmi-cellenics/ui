/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Collapse, Space } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';


const { Panel } = Collapse;

const DraggableList = (props) => {
  const { plots } = props;
  const [items, setItems] = useState(plots);

  const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',

    margin: '0 0 8px 0',

    // styles we need to apply on draggables
    ...draggableStyle,
  });

  const getListStyle = (isDraggingOver) => {
    let res = { width: '100%' };

    if (isDraggingOver) {
      res = { ...res, background: '#cfe6e5' };
    }

    return res;
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const newItems = reorder(
      items,
      result.source.index,
      result.destination.index,
    );

    props.onChange(newItems);
    setItems(newItems);
  };

  const renderExtras = (item, provided) => (
    <Space>
      <CloseOutlined onClick={(event) => {
        const newItems = items.filter((obj) => obj.key !== item.key);

        setItems(newItems);
        props.onChange(newItems);
        event.stopPropagation();
      }}
      />
      <MenuOutlined
        onClick={(event) => (event.stopPropagation()
        )}
        style={{ cursor: 'grab' }}
        {...provided.dragHandleProps}
      />
    </Space>
  );

  const renderDraggables = (item, index) => (
    <Draggable key={item.key} draggableId={item.key} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style,
          )}
        >
          <Collapse defaultActiveKey={[item.key]}>
            <Panel
              header={item.name}
              key={item.key}
              extra={renderExtras(item, provided)}
            >
              {item.renderer()}
            </Panel>
          </Collapse>
        </div>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver)}
          >
            {items.map((item, index) => renderDraggables(item, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};


DraggableList.defaultProps = {
  onChange: () => null,
};

DraggableList.propTypes = {
  onChange: PropTypes.func,

};

export default DraggableList;
