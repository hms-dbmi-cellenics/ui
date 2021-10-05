import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';

configure({ adapter: new Adapter() });

beforeAll(async () => {
  console.log('starting the tests ******');
  await preloadAll();
});

beforeEach(async () => {
  console.log('HELLO WORLD ++++++++++');
});
