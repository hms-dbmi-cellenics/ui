import React from 'react';
import dayjs from 'dayjs';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

import initialState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import ProjectCard from 'components/data-management/ProjectCard';

const experimentId = 'experimentId1';
const experimentName = 'Test Experiment';
const samplesIdsArray = new Array(13).fill(null).map((_, i) => (`sample-${i}`));
const createdAt = dayjs().subtract(30, 'days').format();
const updatedAt = dayjs().subtract(30, 'minutes').format();

const experimentState = {
  experiments: {
    ...initialState,
    [experimentId]: {
      ...experimentTemplate,
      id: experimentId,
      name: experimentName,
      sampleIds: samplesIdsArray,
      createdAt,
      updatedAt,
    },
  },
};

const mockStore = configureMockStore([thunk]);

// Based on https://stackoverflow.com/a/51045733
const flushPromises = () => new Promise(setImmediate);

describe('ProjectCard', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Displays correctly', () => {
    render(
      <Provider store={mockStore(experimentState)}>
        <ProjectCard experimentId={experimentId} />
      </Provider>,
    );

    // Experiment name is shown
    expect(screen.getByText(new RegExp(experimentName, 'i'))).toBeInTheDocument();

    // Number of samples is shown
    expect(screen.getByText(samplesIdsArray.length)).toBeInTheDocument();

    // Created date is shown
    expect(screen.getByText(dayjs(createdAt).fromNow())).toBeInTheDocument();

    // Last modified is shown
    expect(screen.getByText(dayjs(updatedAt).fromNow())).toBeInTheDocument();
  });

  it('Displays the delete project modal when delete experiment is clicked', async () => {
    render(
      <Provider store={mockStore(experimentState)}>
        <ProjectCard experimentId={experimentId} />
      </Provider>,
    );

    // Click delete project button
    userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Modal is shown
    const modal = await screen.findByText('Confirm delete');
    expect(modal).toBeInTheDocument();
  });

  it('Updates project name when clicked', async () => {
    render(
      <Provider store={mockStore(experimentState)}>
        <ProjectCard experimentId={experimentId} />
      </Provider>,
    );

    // Click edit project button
    act(() => {
      userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    });

    // Write the new name
    userEvent.clear(screen.getByTestId('editableFieldInput'));
    userEvent.type(screen.getByTestId('editableFieldInput'), 'new experiment name');

    // Click save changes button
    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${experimentId}`,
      {
        body: JSON.stringify({ name: 'new experiment name' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      },
    );
  });
});
