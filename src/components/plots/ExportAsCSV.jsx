import React from 'react';
import PropTypes from 'prop-types';
import { CSVLink } from 'react-csv';
import { Button } from 'antd';

const ExportAsCSV = (props) => {
  const { data, filename, disabled } = props;
  return (
    <CSVLink data={data} filename={filename}>
      <Button
        size='small'
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
};
ExportAsCSV.defaultProps = {
  disabled: false,
};
export default ExportAsCSV;
