import { combineReducers } from '@reduxjs/toolkit';

import slots from './Slots/Slots';
import user from './User/User';
import aucSettings from './AucSettings/AucSettings';
import matryoshka from './Matryoshka/Matryoshka';

const rootReducer = combineReducers({
  slots,
  user,
  aucSettings,
  matryoshka,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
