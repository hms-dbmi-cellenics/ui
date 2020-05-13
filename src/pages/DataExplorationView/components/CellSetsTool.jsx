import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Space, Button, Tooltip, Skeleton,
} from 'antd';
import useSWR from 'swr';
import { DeleteOutlined } from '@ant-design/icons';
import HierarchicalTree from './HierarchicalTree';
import { fetchCellSetAction } from '../../../actions';


const CellSetsTool = (props) => {
  const [, setCheckedKeys] = useState([]);
  const [cellSetData, setCellSetData] = useState([]);
  const { experimentID, fetchCellSet } = props;

  const { data } = useSWR(
    `${process.env.REACT_APP_API_URL}/v1/experiments/${experimentID}/cellSets`,
    (url) => fetch(url)
      .then((res) => res.json()),
  );

  console.log('Firing Cell Set Action now!');
  fetchCellSet();

  console.log(data);

  if (data !== undefined && data.cellSets !== cellSetData) {
    setCellSetData(data.cellSets);
  }

  const onCheck = (keys) => setCheckedKeys(keys);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Tooltip placement="bottom" title="Compute intersection">
          <Button>AND</Button>
        </Tooltip>
        <Tooltip placement="bottom" title="Compute union">
          <Button>OR</Button>
        </Tooltip>
        <Tooltip placement="bottom" title="Compute complement">
          <Button>NOT</Button>
        </Tooltip>
        <Tooltip placement="bottom" title="Remove selected">
          <Button icon={<DeleteOutlined />} />
        </Tooltip>
      </Space>

      {data
        ? (
          <HierarchicalTree
            data={cellSetData}
            onCheck={onCheck}
          />
        )
        : <Skeleton active />}
    </Space>
  );
};


CellSetsTool.defaultProps = {};

CellSetsTool.propTypes = {
  experimentID: PropTypes.string.isRequired,
  fetchCellSet: PropTypes.func.isRequired,
};

export default connect(
  null,
  { fetchCellSet: fetchCellSetAction },
)(CellSetsTool);
