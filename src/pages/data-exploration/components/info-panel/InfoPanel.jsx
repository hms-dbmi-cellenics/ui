import React from 'react';
import { useSelector } from 'react-redux';
import { Descriptions } from 'antd';

const InfoPanel = () => {
  const cellInfo = useSelector((state) => state.cellInfo);
  return (
    <Descriptions size='small' column={4}>
      <Descriptions.Item label='Gene Name'>{cellInfo.geneName || 'Not Available'}</Descriptions.Item>
      <Descriptions.Item label='Cell Barcode' span={2}>{cellInfo.cellName || 'Not Available'}</Descriptions.Item>
      <Descriptions.Item label='Expression Level'>{cellInfo.expression !== undefined ? parseFloat(cellInfo.expression.toFixed(3)) : 'Not Available'}</Descriptions.Item>
    </Descriptions>
  );
};

export default InfoPanel;
