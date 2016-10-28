import { Injectable } from '@angular/core';

import { forEach, isObject, isArray } from './index';

/**
 * 'JsonPointer' class
 *
 * Some utilities for using JSON Pointers with JSON objects and JSON schemas
 * https://tools.ietf.org/html/rfc6901
 *
 * JSON Pointer Functions: get, getFirst, set, remove, has, dict, walk, escape,
 * unescape, parse, compile, toKey, isJsonPointer, isSubPointer, parseObjectPath
 *
 * Based on manuelstofer's json-pointer utilities
 * https://github.com/manuelstofer/json-pointer
 */
export type Pointer = string | string[];

@Injectable()
export class JsonPointer {

  /**
   * 'get' function
   *
   * Uses a JSON Pointer to retrieve a value from an object
   *
   * @param {object} object - Object to get value from
   * @param {Pointer} pointer - JSON Pointer (string or array)
   * @param {boolean = false} getBoolean - Return only true or false?
   * @param {boolean = true} errors - Show error if not found?
   * @return {object} - Located value (or true or false if getBoolean = true)
   */
  static get(
    object: any, pointer: Pointer, getBoolean: boolean = false, errors: boolean = false
  ): any {
    let subObject = object;
    let keyArray: any[] = this.parse(pointer);
    if (keyArray === null) {
      if (errors) console.error('Unable to get object - invalid JSON Pointer: ' + pointer);
      return getBoolean ? false : null;
    }
    for (let key of keyArray) {
      if (!isObject(subObject) && !isArray(subObject)) {
        if (errors) console.error('Pointer does not match structure of object.');
        if (errors) console.error(pointer);
        if (errors) console.error(object);
        return getBoolean ? false : null;
      } else if (key === '-' && isArray(subObject) && subObject.length) {
        key = subObject.length - 1;
      } else if (!subObject.hasOwnProperty(key)) {
        if (errors) console.error('Unable to find "' + key + '" key in object.');
        if (errors) console.error(pointer);
        if (errors) console.error(object);
        return getBoolean ? false : null;
      }
      subObject = subObject[key];
    }
    return getBoolean ? true : subObject;
  }

  /**
   * 'getFirst' function
   *
   * Takes an array of JSON Pointers and objects, and returns the value
   * from the first pointer to find a value in its object.
   *
   * @param {[object, pointer][]} items - array of objects and pointers to check
   * @param {any} defaultValue - Optional value to return if nothing found
   * @return {any} - first set value
   */
  static getFirst(items: [any, Pointer][], defaultValue: any = null): any {
    if (!isArray(items)) return null;
    for (let item of items) {
      if (isArray(item) && item.length === 2) {
        let value: any = this.get(item[0], item[1]);
        if (value) return value;
      } else {
        console.error(
          'Error: getFirst input not in correct format.\n' +
          'Should be: [ [ object1, pointer1 ], [ object 2, pointer2 ], etc... ]'
        );
      }
    }
    return defaultValue;
  }

  /**
   * 'set' function
   *
   * Uses a JSON Pointer to set a value on an object
   *
   * @param {object} object - object to set value in
   * @param {Pointer} pointer - JSON Pointer (string or array)
   * @param {any} value
   */
  static set(object: any, pointer: Pointer, value: any): any {
    let subObject: any = object;
    let keyArray: string[] = this.parse(pointer);
    if (keyArray === null) {
      console.error('Unable to set - invalid JSON Pointer: ' + pointer);
      return null;
    }
    for (let i = 0, l = keyArray.length - 1; i < l; ++i) {
      let key: string = keyArray[i];
      if (key === '-' && isArray(subObject)) key = subObject.length;
      if (!(subObject.hasOwnProperty(key))) {
        subObject[key] = (keyArray[i + 1].match(/^(\d+|-)$/)) ? [] : {};
      }
      subObject = subObject[key];
    }
    let lastKey: string = keyArray[keyArray.length - 1];
    if (lastKey === '-' && isArray(subObject)) lastKey = subObject.length;
    subObject[lastKey] = value;
    return object;
  }

  /**
   * 'remove' function
   *
   * Uses a JSON Pointer to remove a key and its attribute from an object
   *
   * @param {object} object - object to delete attribute from
   * @param {Pointer} pointer - JSON Pointer (string or array)
   * @return {object}
   */
  static remove(object: any, pointer: Pointer): any {
    let keyArray: any[] = this.parse(pointer);
    if (keyArray === null) {
      console.error('Unable to remove - invalid JSON Pointer: ' + pointer);
      return null;
    }
    let lastKey = keyArray[keyArray.length - 1];
    delete this.get(object, keyArray.slice(0, -1))[lastKey];
    return object;
  }

  /**
   * 'has' function
   *
   * Tests if an object has a value at the location specified by a JSON Pointer
   *
   * @param {object} object - object to chek for value
   * @param {Pointer} pointer - JSON Pointer (string or array)
   * @return {boolean}
   */
  static has(object: any, pointer: Pointer): boolean {
    return this.get(object, pointer, true);
  }

  /**
   * 'dict' function
   *
   * Returns a (pointer -> value) dictionary for an object
   *
   * @param {Object} object - The object to create a dictionary from
   * @return {Object} - The resulting dictionary object
   */
  static dict(object: any) {
    let results: any = {};
    this.walk(object, (value, pointer) => results[pointer] = value);
    return results;
  }

  /**
   * 'walk' function
   *
   * Iterates over an object or array, recursively iterating over any
   * sub-objects or sub-arrays, and calls an iterator function on each
   * primitive value (so all strings, numbers, booleans, and nulls,
   * but not objects or arrays).
   *
   * Iterator: function (value, pointer) => any
   *
   * @param {Object} object - the object or array to walk through
   * @param {function} fn - the iterator function to call on each value
   * @return {Object}
   */
  static walk(object: any, fn: (v: any, p: string) => any) {
    let refTokens = [];
    (function next(item) {
      forEach(item, (value, key) => {
        refTokens.push(String(key));
        if (isObject(value) || isArray(value)) {
          next(value);
        } else {
          fn(value, this.compile(refTokens));
        }
        refTokens.pop();
      });
    } (object));
  }

  /**
   * 'escape' function
   *
   * Escapes a string reference key
   *
   * @param {string} key - string key to escape
   * @return {string} - escaped key
   */
  static escape(key: string): string {
    return key.toString().replace(/~/g, '~0').replace(/\//g, '~1');
  }

  /**
   * 'unescape' function
   * Unescapes a string reference key
   *
   * @param {string} key - string key to unescape
   * @return {string} - unescaped key
   */
  static unescape(key: string): string {
    return key.toString().replace(/~1/g, '/').replace(/~0/g, '~');
  }

  /**
   * 'parse' function
   *
   * Converts a string JSON Pointer into a array of keys
   * (if input is already an an array of keys, it is returned unchanged)
   *
   * @param {Pointer} pointer - JSON Pointer (string or array)
   * @return {string[]} - JSON Pointer array of keys
   */
  static parse(pointer: Pointer): string[] {
    if (isArray(pointer)) return <string[]>pointer;
    if (typeof pointer !== 'string') {
      console.error('Invalid JSON Pointer, not a string or array:');
      console.error(pointer);
      return null;
    }
    if ((<string>pointer)[0] === '#') pointer = pointer.slice(1);
    if (<string>pointer === '') return [];
    if ((<string>pointer)[0] !== '/') {
      console.error('Invalid JSON Pointer, does not start with "/": ' + pointer);
      return null;
    }
    return (<string>pointer).slice(1).split('/').map(this.unescape);
  }

  /**
   * 'compile' function
   *
   * Converts an array of keys into a JSON Pointer string
   * (if input is already a string, it is normalized and returned)
   *
   * The optional second parameter is a default which will replace any empty keys.
   *
   * @param {Pointer} keyArray - JSON Pointer (string or array)
   * @returns {string} - JSON Pointer string
   */
  static compile(keyArray: Pointer, defaultValue: string | number = ''): string {
    if (isArray(keyArray)) {
      if ((<string[]>keyArray).length === 0) return '';
      return '/' + (<string[]>keyArray).map(
        key => key === '' ? defaultValue : this.escape(key)
      ).join('/');
    }
    if (typeof keyArray !== 'string') {
      console.error('Invalid JSON Pointer, not a string or array:');
      console.error(keyArray);
      return null;
    }
    if (keyArray[0] === '#') keyArray = keyArray.slice(1);
    if (keyArray.length && keyArray[0] !== '/') {
      console.error('Invalid JSON Pointer, does not start with "/": ' + keyArray);
      return null;
    }
    return keyArray;
  }

  /**
   * 'toKey' function
   *
   * Extracts name of the final key from a JSON Pointer.
   *
   * @param {Pointer} pointer - JSON Pointer (string or array)
   * @returns {string} - the extracted key
   */
  static toKey(pointer: Pointer): string {
    let keyArray = this.parse(pointer);
    if (keyArray === null) return null;
    if (!keyArray.length) return '';
    return keyArray[keyArray.length - 1];
  }

  /**
   * 'isJsonPointer' function
   *
   * Checks a string value to determine if it is a valid JSON Pointer.
   * This function only checks for valid JSON Pointer strings, not arrays.
   * (Any array of string values is assumed to be a potentially valid JSON Pointer.)
   *
   * @param {any} value - value to check
   * @returns {boolean} - true if value is a valid JSON Pointer, otherwise false
   */
  static isJsonPointer(value: any): boolean {
    if (typeof value === 'string') {
      if (value === '') return true;
      if (value[0] === '#') value = value.slice(1);
      if (value[0] === '/') return true;
    }
    return false;
  }

  /**
   * 'isSubPointer' function
   *
   * Checks whether one JSON Pointer is a subset of another.
   *
   * @param {Pointer} shortPointer -
   * @param {Pointer} longPointer -
   * @return {boolean} - true if shortPointer is a subset of longPointer
   */
  static isSubPointer(
    shortPointer: Pointer, longPointer: Pointer
  ): boolean {
    let shortArray: string[] = (isArray(shortPointer)) ?
      <string[]>shortPointer : this.parse(<string>shortPointer);
    let longArray: string[] = (isArray(longPointer)) ?
      <string[]>longPointer : this.parse(<string>longPointer);
    if (!shortArray || !longArray) {
      console.error('Invalid JSON Pointer, not a string or array:');
      if (!shortArray) console.error(shortPointer);
      if (!longArray) console.error(longPointer);
      return null;
    }
    if (shortArray.length > longArray.length) return false;
    let isSubPointer: boolean = true;
    for (let i of Object.keys(shortArray)) {
      if (shortArray[i] !== longArray[i]) {
        isSubPointer = false;
        break;
      }
    }
    return isSubPointer;
  }

  /**
   * 'parseObjectPath' function
   *
   * Parses a JavaScript object path into an array of keys, which
   * can then be passed to compile() to convert into a JSON Pointer.
   *
   * Based on mike-marcacci's objectpath parse function:
   * https://github.com/mike-marcacci/objectpath
   *
   * @param {string} objectPath - the object path to parse
   * @return {string[]} - the resulting array of keys
   */
  static parseObjectPath(objectPath: string | string[]): string[] {
    if (isArray(objectPath)) return <string[]>objectPath;
    if (typeof objectPath !== 'string') {
      console.error('parseObjectPath can only parse string paths.');
      return null;
    }
    let index: number = 0;
    let parts: string[] = [];
    while (index < objectPath.length) {
      let nextDot: number = objectPath.indexOf('.', index);
      let nextOpenBracket: number = objectPath.indexOf('[', index);
      if (nextDot === -1 && nextOpenBracket === -1) { // last item
        parts.push(objectPath.slice(index));
        index = objectPath.length;
      } else if (
        nextDot !== -1 && (nextDot < nextOpenBracket || nextOpenBracket === -1)
      ) { // dot notation
        parts.push(objectPath.slice(index, nextDot));
        index = nextDot + 1;
      } else { // bracket notation
        if (nextOpenBracket > index) {
          parts.push(objectPath.slice(index, nextOpenBracket));
          index = nextOpenBracket;
        }
        let quote: string = objectPath.charAt(nextOpenBracket + 1);
        if (quote === '"' || quote === "'") { // enclosing quotes
          let nextCloseBracket: number = objectPath.indexOf(quote + ']', nextOpenBracket);
          while (nextCloseBracket !== -1 &&
            objectPath.charAt(nextCloseBracket - 1) === '\\'
          ) {
            nextCloseBracket = objectPath.indexOf(quote + ']', nextCloseBracket + 2);
          }
          if (nextCloseBracket === -1) nextCloseBracket = objectPath.length;
          parts.push(
            objectPath
              .slice(index + 2, nextCloseBracket)
              .replace(new RegExp('\\' + quote, 'g'), quote)
          );
          index = nextCloseBracket + 2;
        } else { // no enclosing quotes
          let nextCloseBracket: number = objectPath.indexOf(']', nextOpenBracket);
          if (nextCloseBracket === -1) nextCloseBracket = objectPath.length;
          parts.push(objectPath.slice(index + 1, nextCloseBracket));
          index = nextCloseBracket + 1;
        }
        if (objectPath.charAt(index) === '.') index++;
      }
    }
    return parts;
  }
}
