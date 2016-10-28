import {
  AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import {
  isPresent, isBlank, isSet, isEmpty, isString,
  isInteger, isFunction, isObject, isArray, getType,
  JsonPointer, JsonValidators, toJavaScriptType, toSchemaType,
  JavaScriptType, PlainObject, SchemaPrimitiveType, SchemaType,
} from './index';

/**
 * Utility function library:
 *
 * forEach, forOwn, forOwnDeep, hasOwn, inArray, toTitleCase, xor
 */

/**
 * 'forEach' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator funciton on each item.
 *
 * Does NOT recursively iterate over items in sub-objects or sub-arrays.
 *
 * Based on manuelstofer's foreach function:
 * https://github.com/manuelstofer/foreach
 *
 * @param {Object|Array} col - collection: the object or array to iterate over
 * @param {function} fn - the iterator funciton to call on each item
 * @param {any = null} ctx - an optional context in which to call the iterator function
 * @return {void}
 */
export function forEach(
  col: any, fn: (v: any, k: string | number, c?: any) => any, ctx: any = null
): void {
  if (typeof fn !== 'function') {
    console.error('Iterator must be a function'); return;
  } else if (!isObject(col) && !isArray(col)) {
    console.error('Collection must be an object or array'); return;
  }
  if (typeof col === 'object') {
    for (let k of Object.keys(col)) fn.call(ctx, col[k], k, col);
  }
}

/**
 * 'forOwnDeep' function
 *
 * Iterates over own enumerable properties of an object or items in an array
 * and invokes an iteratee function for each key/value or index/value pair.
 *
 * Similar to the Lodash _.forOwn and _.forEach functions, except:
 *
 * - This function also iterates over sub-objects and arrays after calling
 * the iteratee function on the containing object or array itself
 * (except for the root object or array).
 *
 * - The iteratee function is invoked with four arguments (instead of three):
 * (value, key/index, rootObject, jsonPointer), where rootObject is the root
 * object submitted (not necesarily the sub-object directly containing the
 * key/value or index/value), and jsonPointer is a JSON pointer indicating the
 * location of the key/value or index/value within the root object.
 *
 * - This function can also optionally be called directly on a sub-object by
 * including optional parameterss to specify the initial root object and JSON pointer.
 *
 * - A fifth optional boolean parameter of TRUE may also be added, which causes
 * the iterator function to be called on sub-objects and arrays before being
 * called on the containing object or array itself. (Excluding the root
 * object or array).
 *
 * @param {object} object - the initial object or array
 * @param {(v: any, k?: string, o?: any, p?: any) => any} function - iteratee function
 * @param {object = object} rootObject - optional, root object or array
 * @param {string = ''} jsonPointer - optional, JSON Pointer to object within rootObject
 * @param {boolean = false} bottomUp - optional, set to TRUE to reverse direction
 * @return {object} - the object or array
 */
export function forOwnDeep( object: any,
  fn: (value: any, key?: string, object?: any, jsonPointer?: string) => any,
  rootObject: any = null, jsonPointer: string = '', bottomUp: boolean = false
): any {
  let isRoot: boolean = !rootObject;
  if (isRoot) { rootObject = object; }
  let currentKey = JsonPointer.parse(jsonPointer).pop();
  if (!isRoot && !bottomUp) fn(object, currentKey, rootObject, jsonPointer);
  if (isArray(object) || isObject(object)) {
    for (let key of Object.keys(object)) {
      forOwnDeep(object[key], fn, rootObject,
        jsonPointer + '/' + JsonPointer.escape(key), bottomUp);
    };
  }
  if (!isRoot && bottomUp) fn(object, currentKey, rootObject, jsonPointer);
  return object;
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
    let inArray: boolean = allIn;
    for (let subItem of item) {
      if (xor(array.indexOf(subItem) !== -1, allIn)) {
        inArray = !allIn;
        break;
      }
    }
    return inArray;
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
  if (!isObject(object)) return false;
  return object.hasOwnProperty(property);
}

/**
 * 'forOwn' utility function
 *
 * Iterates through an object and calls a function on each key and value.
 * The function is called with three arguments: (value, key, object).
 * Returns a new object with the same keys as the original object,
 * but with the values returned by the function.
 *
 * @param {object} object - the object to iterate through
 * @param {(v: string, k: any) => any} fn - the function to call
 * @return {PlainObject} - the resulting object
 */
export function forOwn(
  object: PlainObject, fn: (v: any, k: string, o: PlainObject) => any
): PlainObject {
  if (getType(object) !== 'object') return null;
  if (isEmpty(object)) return {};
  let newObject = {};
  for (let field in object) {
    if (object.hasOwnProperty(field)) {
      newObject[field] = fn(object[field], field, object);
    }
  }
  return newObject;
}

/**
 * 'toTitleCase' function
 *
 * Intelligently converts an input string to Title Case.
 *
 * Accepts an optional second parameter with an alternate list of
 * words and abbreviations to force into a particular case.
 *
 * This function is built on prior work by John Gruber and David Gouch:
 * http://daringfireball.net/2008/08/title_case_update
 * https://github.com/gouch/to-title-case
 *
 * @param  {string} input -
 * @param  {string | string[]} forceWords? -
 * @return {string} -
 */
export function toTitleCase(input: string, forceWords?: string | string[]): string {
  let forceArray: string[] = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'en', 'for', 'if',
    'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'v', 'v.', 'vs', 'vs.', 'via'];
  if (typeof forceWords === 'string') forceWords = forceWords.split('|');
  if (Array.isArray(forceWords)) forceArray = forceArray.concat(forceWords);
  let forceArrayLower: string[] = forceArray.map(w => w.toLowerCase());
  let noInitialCase: boolean =
    input === input.toUpperCase() || input === input.toLowerCase();
  let prevLastChar: string = '';
  input = input.trim();
  return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, (word, idx) => {
    if (!noInitialCase && word.slice(1).search(/[A-Z]|\../) !== -1) {
      return word;
    } else {
      let newWord: string;
      let forceWord: string = forceArray[forceArrayLower.indexOf(word.toLowerCase())];
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
