/* eslint-disable react/destructuring-assignment */
import React from 'react';
import PropTypes from 'prop-types';
import postErrorToSlack from 'utils/postErrorToSlack';
import { connect } from 'react-redux';
import Error from 'pages/_error';

// Implementation of https://reactjs.org/docs/error-boundaries.html
// Using React class because it's not yet supported for functional components
// according to https://stackoverflow.com/a/68075800/1940886
class ErrorBoundary extends React.Component {
  // The parent constructor needs to be called so that the
  // proper functions are setup and views can be rendered
  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // This function needs to still be defined even if empty
  // so that the Component can render a view even when there are errors
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Act on the error inside this function
    if (this.props.environment !== 'production') return;
    const { reduxDump } = this.props;
    postErrorToSlack(error, errorInfo, reduxDump);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <Error />;
    }
    return this.props.children;
  }
}

function mapStateToProps(state) {
  return {
    environment: state.networkResources.environment,
    reduxDump: state,
  };
}

ErrorBoundary.propTypes = {
  reduxDump: PropTypes.object,
  environment: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

ErrorBoundary.defaultProps = {
  reduxDump: {},
};

export default connect(mapStateToProps)(ErrorBoundary);
