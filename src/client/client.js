import hotRoutes from 'hot-callback-loader?export=default!../common/components/Routes';
import hotReducer from 'hot-callback-loader?export=default!../common/reducers';

import ReactClient from './ReactClient';

const client = new ReactClient();
hotRoutes(client.setReactRoutes);
hotReducer(client.setReduxReducer);

client.init();
