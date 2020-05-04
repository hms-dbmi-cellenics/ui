import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import ContentWrapper from './components/content-wrapper/ContentWrapper';
import DataExplorationView from './pages/DataExplorationView';

import './App.less';

let socket;

function App() {
  return (
    <Router>
      <ContentWrapper>
        <Switch>
          <Route exact path="/">
            <DataExplorationView />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/dashboard">
            <Dashboard />
          </Route>
        </Switch>
      </ContentWrapper>
    </Router>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
    </div>
  );
}

export default App;
export const io = socket;
