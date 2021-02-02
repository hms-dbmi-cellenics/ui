import React from 'react';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import { Menu } from 'antd';
import ContentWrapper from '../../../components/ContentWrapper';

const { Item } = Menu;

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockImplementation(() => ({
    query: {
      experimentId: '1234',
    },
  })),
}));

configure({ adapter: new Adapter() });

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  notifications: {},
});

describe('ContentWrapper', () => {
  it('renders correctly', () => {
    const wrapper = mount(
      <Provider store={store}>
        <ContentWrapper>
          <></>
        </ContentWrapper>
      </Provider>,
    );
    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);

    const menus = wrapper.find(Menu).children().find(Item);
    expect(menus.length).toEqual(3);

    const dataProcessingLink = menus.at(0).find('Link');
    expect(dataProcessingLink.props().as).toEqual('/experiments/1234/data-processing');

    const dataExplorationLink = menus.at(1).find('Link');
    expect(dataExplorationLink.props().as).toEqual('/experiments/1234/data-exploration');

    const plotsTablesLink = menus.at(2).find('Link');
    expect(plotsTablesLink.props().as).toEqual('/experiments/1234/plots-and-tables');
  });
});
