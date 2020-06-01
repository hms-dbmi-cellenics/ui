import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import ContentWrapper from '../components/content-wrapper/ContentWrapper';
import DataExplorationView from './DataExplorationView';

const isServer = typeof window === 'undefined';

const App = () => {
  if (isServer) {
    // eslint-disable-next-line global-require
    const { StaticRouter } = require('react-router');
    return (
      <StaticRouter>
        <Content />
      </StaticRouter>
    );
  }
  return (
    <Router>
      <Content />
    </Router>
  );
};

const Content = () => (
  <ContentWrapper>
    <Switch>
      <Route exact path='/'>
        <DataExplorationView />
      </Route>
      <Route path='/about'>
        <About />
      </Route>
      <Route path='/dashboard'>
        <Dashboard />
      </Route>
    </Switch>
  </ContentWrapper>
);

const About = () => (
  <div>
    <h2>About</h2>
  </div>
);

const Dashboard = () => (
  <div>
    <h2>Dashboard</h2>
  </div>
);

export default App;
