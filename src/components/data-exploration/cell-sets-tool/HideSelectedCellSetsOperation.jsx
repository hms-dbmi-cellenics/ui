import React from 'react';
import PropTypes from 'prop-types';

import { useDispatch, useSelector } from 'react-redux';

import { Tooltip, Button } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

import { setCellSetHiddenStatus } from 'redux/actions/cellSets';
import { getCellSets } from 'redux/selectors';

const HideSelectedCellSetsOperation = (props) => {
  const { selectedCellSetKeys } = props;

  const dispatch = useDispatch();
  const { hidden: hiddenCellSets } = useSelector(getCellSets());

  const allSelectedHidden = selectedCellSetKeys.every((key) => hiddenCellSets.has(key));

  const onToggleHidden = () => {
    selectedCellSetKeys.forEach((cellSetKey) => {
      dispatch(setCellSetHiddenStatus(cellSetKey));
    });
  };

  const buttonIcon = allSelectedHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />;
  const buttonText = allSelectedHidden ? 'Show selected cell sets' : 'Hide selected cell sets';

  return (
    <Tooltip placement='top' title={buttonText}>
      <Button
        type='dashed'
        icon={buttonIcon}
        aria-label={buttonText}
        size='small'
        onClick={onToggleHidden}
      />
    </Tooltip>
  );
};

HideSelectedCellSetsOperation.propTypes = {
  selectedCellSetKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default HideSelectedCellSetsOperation;
