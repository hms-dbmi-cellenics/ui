import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip, Button,
} from 'antd';
import {
  useSelector, useDispatch,
} from 'react-redux';
import { setCellSetHiddenStatus } from '../../../redux/actions/cellSets';

const HideButton = (props) => {
  const { experimentId, cellSetKey } = props;

  const dispatch = useDispatch();
  const buttonRef = useRef(null);

  const hiddenCellSets = useSelector((state) => state.cellSets.hidden);

  const buttonString = (hiddenCellSets.has(cellSetKey)) ? 'Unhide' : 'Hide';
  const style = {};

  if ((hiddenCellSets.has(cellSetKey))) {
    style.color = '#40a9ff';
    style.borderColor = '#40a9ff';
  }

  return (
    <Tooltip placement='right' title={`${buttonString} cells from embedding and heatmap`}>
      <Button
        size='small'
        style={style}
        ref={buttonRef}
        onClick={(e) => {
          // Prevent clicking button from clicking the component it is embedded in (i.e. table row).
          e.stopPropagation();

          // Lose focus so the button changes color from blue to black when you click on it.
          buttonRef.current.blur();

          dispatch(setCellSetHiddenStatus(experimentId, cellSetKey));
        }}
      >
        {buttonString}
      </Button>
    </Tooltip>
  );
};

HideButton.propTypes = {
  experimentId: PropTypes.string.isRequired,
  cellSetKey: PropTypes.string.isRequired,
};

export default HideButton;
