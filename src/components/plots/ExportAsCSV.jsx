import React from 'react';
import PropTypes from 'prop-types';
import { CSVLink } from 'react-csv';
import { Button } from 'antd';

const ExportAsCSV = (props) => {
  const {
    data, filename, disabled, size,
  } = props;
  return (
    <CSVLink data={data} filename={filename}>
      <Button
        size={size}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
      >
        Export as CSV
      </Button>
    </CSVLink>
  );
};

ExportAsCSV.propTypes = {
  data: PropTypes.array.isRequired,
  filename: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  size: PropTypes.string,
};
ExportAsCSV.defaultProps = {
  disabled: false,
  size: 'small',
};
export default ExportAsCSV;
