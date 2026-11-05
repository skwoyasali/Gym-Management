import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import memberReducer from "./memberSlice";

export default configureStore({
  reducer: {
    auth: authReducer,

    members: memberReducer,
  },
});
