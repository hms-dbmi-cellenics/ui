/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Table } from 'antd';

import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import { MenuOutlined } from '@ant-design/icons';
import { arrayMoveImmutable } from 'utils/array-move';

import '../../utils/css/data-management.css';

const DragHandle = sortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />);

const SamplesTable = () => {
  const columns = [
    {
      index: 0,
      dataIndex: 'sort',
      key: 'sort',
      width: 30,
      render: () => <DragHandle />,
    },
    {
      index: 1,
      key: 'sample',
      title: 'Sample',
      dataIndex: 'name',
      fixed: true,
      className: 'data-test-class-sample-cell',
    },
    {
      title: 'Age',
      dataIndex: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
    },
  ];

  const data = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
      index: 0,
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
      index: 1,
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
      index: 2,
    },
  ];

  const [tableData, setTableData] = useState(data);
  const SortableItem = sortableElement((props) => <tr {...props} />);
  const SortableContainer = sortableContainer((props) => <tbody {...props} />);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      const newData = arrayMoveImmutable([].concat(data), oldIndex, newIndex).filter((el) => !!el);
      console.log('Sorted items: ', newData);
      setTableData(newData);
    }
  };

  const DraggableContainer = (otherProps) => (
    <SortableContainer
      useDragHandle
      disableAutoscroll
      helperClass='row-dragging'
      onSortEnd={onSortEnd}
      {...otherProps}
    />
  );

  const DraggableRow = (otherProps) => {
    // function findIndex base on Table rowKey props and should always be a right array index
    const index = data.findIndex((x) => x.index === otherProps['data-row-key']);
    return <SortableItem index={index} {...otherProps} />;
  };
  return (
    <Table
      size='small'
      bordered
      sticky
      pagination={false}
      dataSource={tableData}
      columns={columns}
      rowKey='index'
      components={{
        body: {
          wrapper: DraggableContainer,
          row: DraggableRow,
        },
      }}
    />
  );
};
export default SamplesTable;
