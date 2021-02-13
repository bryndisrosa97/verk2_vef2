export function formatclock(signed) {
  const signed3 = (signed.toISOString());
  const signed2 = (signed3.substring(0, 10));
  const signed1 = (signed2.split('-')).reverse().join('.');
  return signed1;
}

export function formatAnonymous(name, anonymous) {
  if (anonymous === true) {
    const u = 'Nafnlaus';
    return u;
  }
  return name;
}
