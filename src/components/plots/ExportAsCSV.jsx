import React from 'react';
import PropTypes from 'prop-types';
import { CSVLink } from 'react-csv';
import { Button } from 'antd';

const ExportAsCSV = (props) => {
  const { data, filename, disabled } = props;

  return (
    <CSVLink data={data} filename={filename}>
      <Button
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        size='small'
      >
        Export as CSV...
      </Button>
    </CSVLink>
  );
};

ExportAsCSV.propTypes = {
  data: PropTypes.array.isRequired,
  filename: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};
export default ExportAsCSV;
