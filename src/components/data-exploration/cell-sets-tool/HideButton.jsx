import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip, Button,
} from 'antd';
import {
  useSelector, useDispatch,
} from 'react-redux';
import { setCellSetHiddenStatus } from 'redux/actions/cellSets';
import { getCellSets } from 'redux/selectors';
import colors from 'utils/styling/colors';

const HideButton = (props) => {
  const { cellSetKey } = props;

  const dispatch = useDispatch();
  const buttonRef = useRef(null);
  const { hidden: hiddenCellSets } = useSelector(getCellSets());

  const buttonString = (hiddenCellSets.has(cellSetKey)) ? 'Unhide' : 'Hide';
  const style = {};

  if ((hiddenCellSets.has(cellSetKey))) {
    style.color = colors.lightBlue;
    style.borderColor = colors.lightBlue;
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

          dispatch(setCellSetHiddenStatus(cellSetKey));
        }}
      >
        {buttonString}
      </Button>
    </Tooltip>
  );
};

HideButton.propTypes = {
  cellSetKey: PropTypes.string.isRequired,
};

export default HideButton;
