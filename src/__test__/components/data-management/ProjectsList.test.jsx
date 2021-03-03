import React from 'react';
import { Card } from 'antd';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import '@testing-library/jest-dom';
import ProjectsList from '../../../pages/data-management/components/ProjectsList';

configure({ adapter: new Adapter() });

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('ProjectsList', () => {
  it('renders without options', () => {
    const component = shallow(<ProjectsList />);
    expect(component.exists()).toEqual(true);
  });

  it('contains required components', () => {
    const component = mount(<ProjectsList />);

    // a button by default
    expect(component.find(Card).length).toEqual(0);
  });

  it('has no project if there is no proejct', () => {
    const projects = [];

    const component = mount(<ProjectsList projects={projects} />);

    // expect the number of projects to be the same as the one in the list
    expect(component.find(Card).length).toEqual(projects.length);
  });

  it('contains components if there are projects', () => {
    const projects = [
      {
        name: 'Project 1',
        createdDate: '01-01-2021',
        lastModified: '01-01-2021',
        numSamples: 0,
        lastAnalyzed: '-',
      },
      {
        name: 'Project 2',
        createdDate: '01-01-2021',
        lastModified: '01-01-2021',
        numSamples: 0,
        lastAnalyzed: '-',
      },
      {
        name: 'Project 3',
        createdDate: '01-01-2021',
        lastModified: '01-01-2021',
        numSamples: 0,
        lastAnalyzed: '-',
      },
    ];

    const component = mount(<ProjectsList projects={projects} />);

    // expect the number of projects to be the same as the one in the list
    expect(component.find(Card).length).toEqual(projects.length);
  });
});
