
import express from 'express';

export function formatclock(signed) {
  signed = (signed.toISOString());
  signed = (signed.substring(0, 10));
  signed = (signed.split('-')).reverse().join('.');
  return signed;
}

export function formatAnonymous(name, anonymous) {
  if(anonymous == true) {
    name = 'nafnlaus';
  }
  return name;
}