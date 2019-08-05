import React from 'react';

import { shallow } from 'enzyme';

import { Form } from '../Form';

it('Test for incomplete form', () => {
  const spy = jest.spyOn(Form.prototype, 'onSubmit');

  const wrapper = shallow(<Form />);

  const button = wrapper.find('button');

  expect(button).toBeDefined();
  button.simulate('click');
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockClear();
});
