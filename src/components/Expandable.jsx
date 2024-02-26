import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Expandable = (props) => {
  const { expandedContent, collapsedContent } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <span
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      {!isExpanded ? collapsedContent
        : (
          <>
            {expandedContent}
          </>
        )}
    </span>
  );
};

Expandable.propTypes = {
  expandedContent: PropTypes.node.isRequired,
  collapsedContent: PropTypes.node.isRequired,
};

Expandable.defaultProps = {};

export default Expandable;
