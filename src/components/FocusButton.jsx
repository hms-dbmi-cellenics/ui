import React, { useRef } from 'react';

import { Tooltip, Button } from 'antd';
import { EyeTwoTone, EyeOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import {
  useSelector, useDispatch,
} from 'react-redux';

import { setCellInfoFocus } from '../redux/actions/cellInfo';

const FocusButton = (props) => {
  const { store, lookupKey, experimentId } = props;

  const dispatch = useDispatch();

  const focusData = useSelector((state) => state.cellInfo.focus);
  const buttonRef = useRef(null);

  const onClick = (e) => {
    // Prevent clicking button from clicking the component it is embedded in (i.e. table row).
    e.stopPropagation();

    // Lose focus so the button changes color from blue to black when you click on it.
    buttonRef.current.blur();

    dispatch(setCellInfoFocus(experimentId, store, lookupKey));
  };

  const focused = focusData.store === store && focusData.key === lookupKey;

  return (
    <Tooltip placement='right' title={`${(focused) ? 'Hide color on' : 'Show color on'} embedding`} destroyTooltipOnHide>
      <Button
        type='dashed'
        aria-label='Show on embedding'
        style={{ background: 'none' }}
        size='small'
        onClick={onClick}
        ref={buttonRef}
      >
        {focused
          ? (<EyeTwoTone style={{ cursor: 'pointer' }} />)
          : (<EyeOutlined style={{ cursor: 'pointer' }} />)}
      </Button>
    </Tooltip>
  );
};

FocusButton.propTypes = {
  experimentId: PropTypes.string.isRequired,
  lookupKey: PropTypes.string.isRequired,
  store: PropTypes.string.isRequired,
};

export default FocusButton;
