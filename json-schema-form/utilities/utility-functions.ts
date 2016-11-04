import {
  AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as Immutable from 'immutable';

import {
  hasValue, isArray, isObject, isEmpty, isMap, JsonPointer, PlainObject,
} from './index';

/**
 * Utility function library:
 *
 * addClasses, copy, forEach, forEachCopy, hasOwn, inArray, toTitleCase, xor
*/

/**
 * 'addClasses' function
 *
 * @param {string | string[]} oldClasses
 * @param {string | string[]} newClasses
 * @return {string | string[]}
 */
export function addClasses(oldClasses, newClasses) {
  if (!isArray(oldClasses) && typeof oldClasses !== 'string') return newClasses;
  if (!isArray(newClasses) && typeof newClasses !== 'string') return oldClasses;
  let addArray: string[] = isArray(oldClasses) ?
    oldClasses : oldClasses.trim().split(' ');
  let newArray: string[] = isArray(newClasses) ?
    newClasses : newClasses.trim().split(' ');
  for (let newClass of newArray) {
    if (addArray.indexOf(newClass) === -1) addArray.push(newClass);
  }
  return isArray(oldClasses) ? addArray : addArray.join(' ').trim();
}

/**
 * 'copy' function
 *
 * Makes a shallow copy of a JavaScript object or array.
 * If passed a JavaScript primitive value (string, number, boolean, or null),
 * it returns the value.
 *
 * @param {Object|Array|string|number|boolean|null} object - The object to copy
 * @return {Object|Array|string|number|boolean|null} - The copied object
 */
export function copy(object: any): any {
  if (typeof object !== 'object' || object === null) return object;
  if (isObject(object)) return Object.assign({}, object);
  if (isArray(object)) return [].concat(object);
  if (isMap(object)) return new Map(object);
  console.error('copy error: Object to copy must be a JavaScript object,' +
    'array, or primitive value.');
}

/**
 * 'forEach' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator funciton on each item.
 *
 * Does NOT recursively iterate over items in sub-objects or sub-arrays.
 *
 * @param {Object|Array} object - The object or array to iterate over
 * @param {function} fn - the iterator funciton to call on each item
 * @return {void}
 */
export function forEach(
  object: any, fn: (v: any, k: string | number, c?: any) => any
): void {
  if (isEmpty(object)) return;
  if ((isObject(object) || isArray(object)) && typeof fn === 'function') {
    for (let key of Object.keys(object)) fn(object[key], key, object);
  } else if (typeof fn !== 'function') {
    console.error('forEach error: Iterator must be a function.');
    console.error(fn);
  } else {
    console.error('forEach error: Input object must be an object or array.');
    console.error(object);
  }
}

/**
 * 'forEachCopy' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator function on each item. Returns a new object or array
 * with the same keys or indexes as the original, and values set to the results
 * of the iterator function.
 *
 * Does NOT recursively iterate over items in sub-objects or sub-arrays.
 *
 * @param {Object|Array} object - The object or array to iterate over
 * @param {function} fn - The iterator funciton to call on each item
 * @param {any = null} context - An optional context in which to call the iterator function
 * @return {Object|Array} - A new object or array with the results of the iterator function
 */
export function forEachCopy(
  object: any, fn: (v: any, k?: string | number, o?: any, p?: string) => any
): any {
  if (!hasValue(object)) return;
  if ((isObject(object) || isArray(object)) && typeof fn !== 'function') {
    let newObject: any = isArray(object) ? [] : {};
    for (let key of Object.keys(object)) {
      newObject[key] = fn(object[key], key, object);
    }
    return newObject;
  }
  if (typeof fn !== 'function') {
    console.error('forEachCopy error: Iterator must be a function.');
    console.error(fn);
  } else {
    console.error('forEachCopy error: Input object must be an object or array.');
    console.error(object);
  }
}

/**
 * 'inArray' function
 *
 * Searches an array for an item, or one of a list of items, and returns true
 * as soon as a match is found, or false if no match.
 *
 * If the optional third parameter allIn is set to TRUE, and the item to find
 * is an array, then the function returns true only if all elements from item
 * are found in the list, and false if any element is not found. If the item to
 * find is not an array, setting allIn to TRUE has no effect.
 *
 * @param {any|any[]} item - the item to search for
 * @param {any[]} array - the array to search
 * @param {boolean = false} allIn - if TRUE, all items must be in array
 * @return {boolean} - true if item(s) in array, false otherwise
 */
export function inArray(item: any|any[], array: any[], allIn: boolean = false): boolean {
  if (isArray(item)) {
    for (let subItem of item) {
      if (xor(array.indexOf(subItem) !== -1, allIn)) return !allIn;
    }
    return allIn;
  } else {
    return array.indexOf(item) !== -1;
  }
}

/**
 * 'xor' utility function - exclusive or
 *
 * Returns true if exactly one of two values is truthy.
 *
 * @param {any} value1 - first value to check
 * @param {any} value2 - second value to check
 * @return {boolean} - true if exactly one input value is truthy, false if not
 */
export function xor(value1: any, value2: any): boolean {
  return (!!value1 && !value2) || (!value1 && !!value2);
}

/**
 * 'hasOwn' utility function
 *
 * Checks whether an object has a particular property.
 *
 * @param {any} object - the object to check
 * @param {string} property - the property to look for
 * @return {boolean} - true if object has property, false if not
 */
export function hasOwn(object: PlainObject, property: string): boolean {
  if (typeof object !== 'object') return false;
  return object.hasOwnProperty(property);
}

/**
 * 'toTitleCase' function
 *
 * Intelligently converts an input string to Title Case.
 *
 * Accepts an optional second parameter with a list of additional
 * words and abbreviations to force into a particular case.
 *
 * This function is built on prior work by John Gruber and David Gouch:
 * http://daringfireball.net/2008/08/title_case_update
 * https://github.com/gouch/to-title-case
 *
 * @param {string} input -
 * @param {string|string[]} forceWords? -
 * @return {string} -
 */
export function toTitleCase(input: string, forceWords?: string|string[]): string {
  let forceArray: string[] = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'en',
   'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'v', 'v.',
   'vs', 'vs.', 'via'];
  if (typeof forceWords === 'string') forceWords = forceWords.split('|');
  if (isArray(forceWords)) forceArray = forceArray.concat(forceWords);
  const forceArrayLower: string[] = forceArray.map(w => w.toLowerCase());
  const noInitialCase: boolean =
    input === input.toUpperCase() || input === input.toLowerCase();
  let prevLastChar: string = '';
  input = input.trim();
  return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, (word, idx) => {
    if (!noInitialCase && word.slice(1).search(/[A-Z]|\../) !== -1) {
      return word;
    } else {
      let newWord: string;
      const forceWord: string =
        forceArray[forceArrayLower.indexOf(word.toLowerCase())];
      if (!forceWord) {
        if (noInitialCase) {
          if (word.slice(1).search(/\../) !== -1) {
            newWord = word.toLowerCase();
          } else {
            newWord = word[0].toUpperCase() + word.slice(1).toLowerCase();
          }
        } else {
          newWord = word[0].toUpperCase() + word.slice(1);
        }
      } else if (
        forceWord === forceWord.toLowerCase() && (
          idx === 0 || idx + word.length === input.length ||
          prevLastChar === ':' || input[idx - 1].search(/[^\s-]/) !== -1 ||
          (input[idx - 1] !== '-' && input[idx + word.length] === '-')
        )
      ) {
        newWord = forceWord[0].toUpperCase() + forceWord.slice(1);
      } else {
        newWord = forceWord;
      }
      prevLastChar = word.slice(-1);
      return newWord;
    }
  });
};
