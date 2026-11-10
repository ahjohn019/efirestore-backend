import { getEasyparcelErrorMessage } from './easyparcel.util';

describe('getEasyparcelErrorMessage', () => {
  it.each([
    ['Invalid collection date', 'Invalid collection date'],
    [[{ message: 'Invalid weight' }], 'Invalid weight'],
    [[[{ message: 'Invalid postcode' }]], 'Invalid postcode'],
    [{ 'shipment.0.height': ['Must be positive'] }, 'shipment.0.height: Must be positive'],
    [undefined, ''],
  ])('extracts the error reason from %j', (input, expected) => {
    expect(getEasyparcelErrorMessage(input)).toBe(expected);
  });
});
