import React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
} from 'antd';

const MAX_LEGEND_ITEMS = 50;

const PlotLegendAlert = (props) => {
  const { stylingSectionName } = props;

  return (
    <center>
      <Alert
        message={(
          <p>
            {'We have hidden the plot legend, because it is too large and it interferes '}
            {'with the display of the plot.'}
            <br />
            {'You can still display the plot legend by changing the value of "Toggle Legend" option '}
            {`in "${stylingSectionName}" settings under "Legend"`}
            .
          </p>
        )}
        type='warning'
      />
    </center>
  );
};

PlotLegendAlert.propTypes = {
  stylingSectionName: PropTypes.string,
};

PlotLegendAlert.defaultProps = {
  stylingSectionName: 'Plot styling',
};

export default PlotLegendAlert;
export { MAX_LEGEND_ITEMS };
