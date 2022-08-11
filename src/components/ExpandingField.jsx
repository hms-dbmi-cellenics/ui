import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ExpandingField = (props) => {
  const { defaultField, expandedField } = props;

  const [displayedField, setDisplayedField] = useState(defaultField);

  return (
    <div
      onMouseEnter={() => setDisplayedField(expandedField)}
      onMouseLeave={() => setDisplayedField(defaultField)}
    >
      {displayedField}
    </div>
  );
};

ExpandingField.propTypes = {
  defaultField: PropTypes.node.isRequired,
  expandedField: PropTypes.node.isRequired,
};

export default ExpandingField;
