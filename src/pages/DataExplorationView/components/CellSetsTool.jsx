import React, { useState } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import PropTypes from 'prop-types';

import {
  Space, Button, Tooltip, Skeleton,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import HierarchicalTree from './HierarchicalTree';
import { fetchCellSetAction } from '../../../actions';

const CellSetsTool = (props) => {
  const [, setCheckedKeys] = useState([]);
  const { experimentID } = props;

  // const { data } = useSWR(
  //   `${process.env.REACT_APP_API_URL}/v1/experiments/${experimentID}/cellSets`,
  //   (url) => fetch(url)
  //     .then((res) => res.json()),
  // );

  const dispatch = useDispatch();
  dispatch(fetchCellSetAction(experimentID));
  const data = useSelector((state) => state.cellSets.data);
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
            data={data}
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

export default CellSetsTool;
