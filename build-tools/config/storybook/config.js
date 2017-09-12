import React from 'react';
import { configure, setAddon, addDecorator } from '@storybook/react';
import infoAddon from '@storybook/addon-info';
import DeviceStateProvider from 'src/common/components/DeviceStateProvider';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { asyncAction } from 'src/common/util/asyncActionMiddleware';
import enhancedReduxFormMiddleware from 'src/common/enhanced-redux-form/enhancedReduxFormMiddleware';
import reducers from 'src/common/reducers';
import { Provider } from 'react-redux';

//Initialize Redux Store
const middleware = [asyncAction, thunk, enhancedReduxFormMiddleware];

const storeEnhancer = compose(applyMiddleware(...middleware));
const store = createStore(reducers, window['state'], storeEnhancer);

addDecorator(story =>
  <Provider store={store}>
    <DeviceStateProvider>
      {story()}
    </DeviceStateProvider>
  </Provider>
);

setAddon(infoAddon);

const req = require.context('../../../stories/', true, /\.stories\.jsx?$/);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
