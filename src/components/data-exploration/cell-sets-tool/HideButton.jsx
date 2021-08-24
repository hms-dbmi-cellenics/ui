import React, { useRef, useState, useEffect } from 'react';
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
  const style = {};

  if ((hiddenCellSets.has(cellSetKey))) {
    style.color = '#40a9ff';
    style.borderColor = '#40a9ff';
  }

  const [disabled, setDisabled] = useState(false);
  const [buttonString, setButtonString] = useState('Hide');

  useEffect(() => {
    setDisabled(false);

    if (hiddenCellSets.has(cellSetKey)) {
      setButtonString('Unhide');
    } else {
      setButtonString('Hide');
    }
  }, [hiddenCellSets]);

  return (
    <Tooltip placement='right' title='Change visibility of cells on embedding and heatmap'>
      <Button
        size='small'
        style={style}
        ref={buttonRef}
        disabled={disabled}
        onClick={(e) => {
          // Prevent clicking button from clicking the component it is embedded in (i.e. table row).
          e.stopPropagation();
          buttonRef.current.blur();

          setDisabled(true);

          if (hiddenCellSets.has(cellSetKey)) {
            setButtonString('Unhiding...');
          } else {
            setButtonString('Hiding...');
          }

          setTimeout(() => {
            dispatch(setCellSetHiddenStatus(experimentId, cellSetKey));
          }, 1500);
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
