import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import ContentWrapper from '../../../components/content-wrapper/ContentWrapper';

configure({ adapter: new Adapter() });

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  notifications: {},
});

describe('ColorPicker', () => {
  test('renders correctly', () => {
    const wrapper = mount(
      <Provider store={store}>
        <ContentWrapper>
          <></>
        </ContentWrapper>
      </Provider>,
    );
    const sider = wrapper.find('Sider');
    expect(sider.length).toEqual(1);
  });
});
