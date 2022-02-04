import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import { render, screen } from '@testing-library/react';

import Header from 'components/Header';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

jest.mock('next-seo');
jest.mock('components/UserButton', () => () => <>User Button</>);

const mockStore = configureMockStore([thunk]);

const mockExperimentName = 'mock experiment';
const mockExperimentId = 'abcd1234';

const storeState = mockStore({
  ...initialExperimentState,
  experiments: {
    [mockExperimentId]: {
      ...experimentTemplate,
      name: mockExperimentName,
    },
  },
});

const pageTitle = 'Data Exploration';

const defaultProps = {
  title: pageTitle,
};

const headerFactory = createTestComponentFactory(Header, defaultProps);

const renderHeader = async (store, props = {}) => render(
  <Provider store={store}>
    {headerFactory(props)}
  </Provider>,
);

const loaderClass = "span[class='css-zog0u6']";

describe('Page Header', () => {
  it('Renders properly', async () => {
    const { container } = await renderHeader(storeState);

    // It contains the page title
    expect(screen.getByText(pageTitle));

    // It contains the invite button
    expect(screen.getByText(/Invite a friend/));

    // It contains the feedback button
    expect(screen.getByText(/Feedback or issues\?/));

    // It contains the user button
    expect(screen.getByText(/User Button/));

    // It should not have the loader by default
    const loader = container.querySelector(loaderClass);
    expect(loader).not.toBeInTheDocument();
  });

  it('Shows the loader bar if loading', async () => {
    const { container } = await renderHeader(storeState, { loading: true });

    // It contains the loader SVG
    const loader = container.querySelector("span[class='css-zog0u6']");
    expect(loader).toBeInTheDocument();
  });

  it('Should render extra elements passed into it', async () => {
    const extraText = 'Extra element';
    await renderHeader(storeState, { extra: <>{extraText}</> });

    // It contains the loader SVG
    expect(screen.getByText(extraText)).toBeInTheDocument();
  });
});
