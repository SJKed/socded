function vibrate(pattern: number | number[]) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch {}
}

export const haptics = {
  yourTurn:   () => vibrate([200]),
  turnChange: () => vibrate([40]),
  voteCalled: () => vibrate([100, 60, 100]),
  caught:     () => vibrate([400, 100, 400]),
  tick:       () => vibrate([25]),
  success:    () => vibrate([80, 40, 120]),
};
