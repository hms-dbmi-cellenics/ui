import React from 'react';
import postErrortoSlack from 'utils/postErrorToSlack';
import { connect } from 'react-redux';
import Error from 'pages/_error';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    postErrortoSlack(error, errorInfo, this.props.reduxDump);
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
    reduxDump: state,
  };
}

export default connect(mapStateToProps)(ErrorBoundary);
