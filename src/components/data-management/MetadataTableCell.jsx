import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'antd';
import MetadataColumn from './MetadataColumn';

const MetadataTableCell = () => ({
  key: 'Iva',
  title: () => (
    <MetadataColumn
      name='Bla ekwrjerejekwj'
      validateInput={
        () => { }
      }
      setCells={() => { }}
      deleteMetadataColumn={() => { }}
      key='Iva'
      activeProjectUuid='1238457483'
    />
  ),
  width: 200,
  dataIndex: 'Iva',
  render: () => (
    <Button>Hello world!</Button>
  ),
});

export default MetadataTableCell;
