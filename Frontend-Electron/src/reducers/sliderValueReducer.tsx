const initialState: number[] = [3400, 6000];

const sliderValueReducer = (state = initialState, action) => {
  switch (action.type) {
    case "UPDATE_SLIDER_VALUE":
      return [...action.payload];

    default:
      return state;
  }
};

export default sliderValueReducer;
