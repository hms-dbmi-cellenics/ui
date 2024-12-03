import '@testing-library/jest-dom/extend-expect';
import preloadAll from 'jest-next-dynamic';

import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

Enzyme.configure({ adapter: new Adapter() });

jest.mock('localforage');
jest.mock('utils/pushNotificationMessage');

// This is needed, because the unit tests don't register the Vitessce imports
jest.mock('components/data-exploration/DynamicVitessceWrappers', () => ({
  Scatterplot: () => 'Mocked Scatterplot',
  Heatmap: () => 'Mocked Heatmap',
  Spatial: () => 'Mocked Spatial',
}));

beforeAll(async () => {
  // Add stuff that needs to run once, before all tests
  await preloadAll();
});

beforeEach(async () => {
  // Add stuff that needs to run before each test
});
