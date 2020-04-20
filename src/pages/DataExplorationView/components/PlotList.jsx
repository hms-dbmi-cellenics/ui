/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Collapse } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

// eslint-disable-next-line import/no-webpack-loader-syntax
import * as styles from '!!../../../utils/less-var-loader!../../../App.less';

const { Panel } = Collapse;

const PlotList = (props) => {
  const { plots } = props;
  const [items, setItems] = useState(plots);

  console.log(styles);

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

    setItems(newItems);
  };

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
          <Collapse>
            <Panel
              header={item.name}
              key={item.key}
              extra={<MenuOutlined style={{ cursor: 'grab' }} {...provided.dragHandleProps} />}
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

export default PlotList;
