import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography, Empty,
} from 'antd';

const { Paragraph } = Typography;

const ExampleExperimentsSpace = ({ introductionText, imageStyle }) => {
  return (
    <Empty
      imageStyle={imageStyle}
      description={<Paragraph>{introductionText}</Paragraph>}
    />
  );
};

ExampleExperimentsSpace.defaultProps = {
  introductionText: '',
  imageStyle: {},
};

ExampleExperimentsSpace.propTypes = {
  introductionText: PropTypes.string,
  imageStyle: PropTypes.object,
};

export default ExampleExperimentsSpace;
