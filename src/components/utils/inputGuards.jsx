export const numbersOnlyKeyDown = (e) => {
  // Block scientific-notation chars (the ask was specifically "e")
  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault();
  }
};