
import React from 'react';
import { Tooltip, Button } from 'antd';
import { EyeTwoTone, EyeOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const GeneLookupButton = (props) => {
  const { focused, onClick } = props;

  return (
    <Tooltip placement='right' title='Show gene expression'>
      <Button type='text' size='small' onClick={onClick}>
        {focused
          ? (<EyeTwoTone style={{ cursor: 'pointer' }} />)
          : (<EyeOutlined style={{ cursor: 'pointer' }} />)}
      </Button>
    </Tooltip>
  );
};

GeneLookupButton.defaultProps = {
  onClick: () => null,
};

GeneLookupButton.propTypes = {
  focused: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
};

export default GeneLookupButton;
