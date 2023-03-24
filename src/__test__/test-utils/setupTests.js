import '@testing-library/jest-dom/extend-expect';
import preloadAll from 'jest-next-dynamic';
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

Enzyme.configure({ adapter: new Adapter() });

jest.mock('localforage');
jest.mock('utils/pushNotificationMessage');

beforeAll(async () => {
  // Add stuff that needs to run once, before all tests
  await preloadAll();
});

beforeEach(async () => {
  // Add stuff that needs to run before each test
});
