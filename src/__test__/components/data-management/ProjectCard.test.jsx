import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import moment from 'moment';
import initialState, { projectTemplate } from 'redux/reducers/projects/initialState';
import ProjectCard from '../../../components/data-management/ProjectCard';

const projectUuid = '12345';
const projectName = 'Test Project';
const samplesIdsArray = new Array(13).fill(null).map((_, i) => (`sample-${i}`));
const createdDate = moment().subtract(30, 'days').format();
const lastModified = moment().subtract(30, 'minutes').format();

const projectState = {
  projects: {
    ...initialState,
    experiments: [],
    [projectUuid]: {
      ...projectTemplate,
      name: projectName,
      uuid: projectUuid,
      samples: samplesIdsArray,
      createdDate,
      lastModified,
    },
  },
};

const mockStore = configureMockStore([thunk]);

describe('ProjectCard', () => {
  it('Displays correctly', () => {
    render(
      <Provider store={mockStore(projectState)}>
        <ProjectCard projectUuid={projectUuid} />
      </Provider>,
    );

    // Project name is shown
    expect(screen.getByText(new RegExp(projectName, 'i'))).toBeInTheDocument();

    // Number of samples is shown
    expect(screen.getByText(samplesIdsArray.length)).toBeInTheDocument();

    // Created date is shown
    expect(screen.getByText(moment(createdDate).fromNow())).toBeInTheDocument();

    // Last modified is shown
    expect(screen.getByText(moment(lastModified).fromNow())).toBeInTheDocument();
  });

  it('Displays the delete project modal when delete project is clicked', async () => {
    render(
      <Provider store={mockStore(projectState)}>
        <ProjectCard projectUuid={projectUuid} />
      </Provider>,
    );

    // Click delete project button
    userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Modal is shown
    const modal = await screen.findByText('Confirm delete');
    expect(modal).toBeInTheDocument();
  });
});
