import currentUser from "./currentUser";
import counter from "./counter";
import sliderValue from "./sliderValueReducer";
import { combineReducers } from "redux";

const rootReducer = combineReducers({
  currentUser,
  counter,
  sliderValue,
});

export default rootReducer;
