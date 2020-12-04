const setSliderValueAction = (sliderValue: number[]) => {
  return {
    type: "UPDATE_SLIDER_VALUE",
    payload: sliderValue,
  };
};

export default {
  setSliderValueAction,
};
