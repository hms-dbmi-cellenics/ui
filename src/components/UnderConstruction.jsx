import React from 'react';
import propTypes from 'prop-types';
import { Empty } from 'antd';

const UnderConstruction = (props) => {
  const { description, style } = props;

  return (
    <Empty
      image='/undraw_Developer_activity_re_39tg.svg'
      description={description}
      alt='A developer coding away on his laptop'
      imageStyle={style}
    />
  );
};

UnderConstruction.propTypes = {
  description: propTypes.string,
  style: propTypes.object,
};

UnderConstruction.defaultProps = {
  description: 'Coming soon!',
  style: {},
};

export default UnderConstruction;
