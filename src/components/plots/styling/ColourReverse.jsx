import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

// Toggle the direction of the (continuous) colour scale. Bound to
// config.colour.reverseCbar — the same flag the overlay colouring and the Vega
// legend both read (see generateSpatialFeatureSpec / SpatialOutlierFilterPlot), so
// flipping it reverses both together. Defaults to whatever the plot config already
// has, i.e. the current direction.
const ColourReverse = (props) => {
  const { onUpdate, config } = props;

  return (
    <Form size='small'>
      <p><strong>Colour Scale Direction:</strong></p>
      <Form.Item>
        <Radio.Group
          onChange={(e) => onUpdate({ colour: { reverseCbar: e.target.value } })}
          value={Boolean(config.colour.reverseCbar)}
        >
          <Radio value={false}>Standard</Radio>
          <Radio value>Reversed</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

ColourReverse.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ColourReverse;
