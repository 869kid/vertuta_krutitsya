import { combineReducers } from '@reduxjs/toolkit';

import slots from './Slots/Slots';
import user from './User/User';
import aucSettings from './AucSettings/AucSettings';
import matryoshka from './Matryoshka/Matryoshka';
import room from './Room/Room';

const rootReducer = combineReducers({
  slots,
  user,
  aucSettings,
  matryoshka,
  room,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
