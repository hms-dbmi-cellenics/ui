import '@testing-library/jest-dom/extend-expect';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';

configure({ adapter: new Adapter() });
jest.mock('localforage');
jest.mock('utils/pushNotificationMessage');

beforeAll(async () => {
  // Add stuff that needs to run once, before all tests
  await preloadAll();
});

beforeEach(async () => {
  // Add stuff that needs to run before each test
});
