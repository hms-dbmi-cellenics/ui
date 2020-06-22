import React from 'react';
import { useSelector } from 'react-redux';
import { Descriptions } from 'antd';

const InfoPanel = () => {
  const cellInfo = useSelector((state) => state.cellInfo);
  return (
    <div>
      <Descriptions>
        <Descriptions.Item label='Gene Name'>{cellInfo.geneName || 'Not Available'}</Descriptions.Item>
        <Descriptions.Item label='Cell Barcode'>{cellInfo.cellName || 'Not Available'}</Descriptions.Item>
        <Descriptions.Item label='Expression Level'>{cellInfo.expression !== undefined ? cellInfo.expression : 'Not Available'}</Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default InfoPanel;
