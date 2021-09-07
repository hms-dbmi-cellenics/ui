import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import initialState, { projectTemplate } from '../../../redux/reducers/projects/initialState';
import ProjectCard from '../../../components/data-management/ProjectCard';

const projectUuid = '12345';
const projectName = 'Test Project';

const projectState = {
  projects: {
    ...initialState,
    ids: [],
    [projectUuid]: {
      ...projectTemplate,
      name: projectName,
      uuid: projectUuid,
    },
  },
};

const mockStore = configureMockStore([thunk]);

describe('ProjectCard', () => {
  it('Displays correctly', () => {
    render(
      <Provider store={mockStore(projectState)}>
        <ProjectCard uuid={projectUuid} />
      </Provider>,
    );

    expect(screen.getByText(new RegExp(projectName, 'i'))).toBeInTheDocument();
  });
});
