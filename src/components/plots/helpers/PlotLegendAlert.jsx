import React from 'react';
import {
  Alert,
} from 'antd';

const PlotLegendAlert = () => (
  <center>
    <Alert
      message={(
        <p>
          {'We have hidden the plot legend, because it is too large and it interferes '}
          {'with the display of the plot.'}
          <br />
          {'You can still display the plot legend by changing the value of "Toggle Legend" option '}
          {'in Plot Styling settings under "Legend"'}
          .
        </p>
      )}
      type='warning'
    />
  </center>
);

export default PlotLegendAlert;
