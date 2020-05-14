import React from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import PropTypes from 'prop-types';

import {
  Space, Button, Tooltip, Skeleton,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import HierarchicalTree from './HierarchicalTree';
import { loadCellSets } from '../../../actions';

const CellSetsTool = (props) => {
  const { experimentID } = props;
  const dispatch = useDispatch();
  const data = useSelector((state) => state.cellSets.data);

  dispatch(loadCellSets(experimentID));

  const onCheck = (keys) => {
    console.log('I am gonna check: ', keys);
  };

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
};

export default CellSetsTool;
