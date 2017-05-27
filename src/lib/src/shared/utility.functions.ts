import {
  hasValue, inArray, isArray, isDefined, isObject, isEmpty, isMap, isSet,
  isString, PlainObject
} from './validator.functions';

/**
 * Utility function library:
 *
 * addClasses, copy, forEach, forEachCopy, hasOwn,
 * mergeFilteredObject, parseText, toTitleCase
*/

/**
 * 'addClasses' function
 *
 * @param {string | string[] | Set<string>} oldClasses
 * @param {string | string[] | Set<string>} newClasses
 * @return {string | string[] | Set<string>} - Combined classes
 */
export function addClasses(
  oldClasses: string | string[] | Set<string>,
  newClasses: string | string[] | Set<string>
): string | string[] | Set<string> {
  const badType = i => !isSet(i) && !isArray(i) && !isString(i);
  if (badType(newClasses)) { return oldClasses; }
  if (badType(oldClasses)) { oldClasses = ''; }
  const toSet = i => isSet(i) ? i : isArray(i) ? new Set(i) : new Set(i.split(' '));
  let combinedSet: Set<any> = toSet(oldClasses);
  let newSet: Set<any> = toSet(newClasses);
  newSet.forEach(c => combinedSet.add(c));
  if (isSet(oldClasses)) { return combinedSet; }
  if (isArray(oldClasses)) { return Array.from(combinedSet); }
  return Array.from(combinedSet).join(' ');
}

/**
 * 'copy' function
 *
 * Makes a shallow copy of a JavaScript object, array, Map, or Set.
 * If passed a JavaScript primitive value (string, number, boolean, or null),
 * it returns the value.
 *
 * @param {Object|Array|string|number|boolean|null} object - The object to copy
 * @return {Object|Array|string|number|boolean|null} - The copied object
 */
export function copy(object: any): any {
  if (typeof object !== 'object' || object === null) { return object; }
  if (isObject(object)) { return Object.assign({}, object); }
  if (isArray(object)) { return [].concat(object); }
  if (isMap(object)) { return new Map(object); }
  if (isSet(object)) { return new Set(object); }
  console.error('copy error: Object to copy must be a JavaScript object or value.');
}

/**
 * 'forEach' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator funciton on each item.
 *
 * The iterator function is called with four values:
 * 1. The current item's value
 * 2. The current item's key
 * 3. The parent object, which contains the current item
 * 4. The root object
 *
 * Setting the optional third parameter to 'top-down' or 'bottom-up' will cause
 * it to also recursively iterate over items in sub-objects or sub-arrays in the
 * specified direction.
 *
 * @param {Object|Array} object - The object or array to iterate over
 * @param {function} fn - the iterator funciton to call on each item
 * @return {void}
 */
export function forEach(
  object: any, fn: (v: any, k?: string | number, c?: any, rc?: any) => any,
  recurse: boolean | string = false, rootObject: any = object
): void {
  if (isEmpty(object)) { return; }
  if ((isObject(object) || isArray(object)) && typeof fn === 'function') {
    for (let key of Object.keys(object)) {
      const value = object[key];
      if (recurse === 'bottom-up' && (isObject(value) || isArray(value))) {
        forEach(value, fn, recurse, rootObject);
      }
      fn(value, key, object, rootObject);
      if (recurse === 'top-down' && (isObject(value) || isArray(value))) {
        forEach(value, fn, recurse, rootObject);
      }
    }
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
 * @param {any = null} context - Context in which to call the iterator function
 * @return {Object|Array} - The resulting object or array
 */
export function forEachCopy(
  object: any, fn: (v: any, k?: string | number, o?: any, p?: string) => any
): any {
  if (!hasValue(object)) { return; }
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
 * 'hasOwn' utility function
 *
 * Checks whether an object has a particular property.
 *
 * @param {any} object - the object to check
 * @param {string} property - the property to look for
 * @return {boolean} - true if object has property, false if not
 */
export function hasOwn(object: any, property: string): boolean {
  if (!isObject(object) && !isArray(object)) { return false; }
  return object.hasOwnProperty(property);
}

/**
 * 'mergeFilteredObject' utility function
 *
 * Shallowly merges two objects, setting key and values from source object
 * in target object, excluding specified keys.
 *
 * Optionally, it can also use functions to transform the key names and/or
 * the values of the merging object.
 *
 * @param {PlainObject} targetObject - Target object to add keys and values to
 * @param {PlainObject} sourceObject - Source object to copy keys and values from
 * @param {string[]} excludeKeys - Array of keys to exclude
 * @param {(string: string) => string = (k) => k} keyFn - Function to apply to keys
 * @param {(any: any) => any = (v) => v} valueFn - Function to apply to values
 * @return {PlainObject} - Returns targetObject
 */
export function mergeFilteredObject(
  targetObject: PlainObject,
  sourceObject: PlainObject,
  excludeKeys: any[] = [],
  keyFn: (string: string) => string = (key: string) => key,
  valFn: (any: any) => any = (val: any) => val
): PlainObject {
  if (!isObject(sourceObject)) { return targetObject; }
  if (!isObject(targetObject)) { targetObject = {}; }
  for (let key of Object.keys(sourceObject)) {
    if (!inArray(key, excludeKeys) && isDefined(sourceObject[key])) {
      targetObject[keyFn(key)] = valFn(sourceObject[key]);
    }
  }
  return targetObject;
}

/**
 * 'parseText' function
 *
 * @param  {string = ''} text -
 * @param  {any = {}} value -
 * @param  {number = null} index -
 * @return {string} -
 */
export function parseText(
  text: string = '', value: any = {}, values: any = {},
  key: number|string = null, tpldata: any = null
): string {
  if (!text) { return text; }
  let idx: number = null; // For JSON Form API compatibility
  let $index: number = null; // For Angular Schema Form API compatibility
  if (typeof key === 'number') { idx = $index = key + 1; }
  try {
      return text.replace(/{{.+?}}/g, exp => eval(exp.slice(2, -2)));
  } catch (error) {
    try {
      return (tpldata) ?
        text.replace(/{{.+?}}/g, exp => eval('tpldata.' + exp.slice(2, -2))) :
        text.replace(/{{.+?}}/g, exp => eval('this.' + exp.slice(2, -2)));
    } catch (error) { }
    console.error('parseText error: ');
    console.error(error);
    return text;
  }
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
  if (!isString(input)) { return input; }
  let forceArray: string[] = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'en',
   'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'v', 'v.',
   'vs', 'vs.', 'via'];
  if (isString(forceWords)) { forceWords = forceWords.split('|'); }
  if (isArray(forceWords)) { forceArray = forceArray.concat(forceWords); }
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
