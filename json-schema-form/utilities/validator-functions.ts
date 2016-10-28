import { AbstractControl } from '@angular/forms';
import { toPromise } from 'rxjs/operator/toPromise';

import { inArray, xor, hasOwn, forOwn } from './index';

/**
 * Validator utility function library:
 *
 * Validator and error utilities:
 *   _executeValidators, _executeAsyncValidators, _mergeObjects, _mergeErrors
 *
 * Individual value checking:
 *   isPresent, isBlank, isSet, isNotSet, isEmpty, isNotEmpty
 *
 * Individual type checking:
 *   isString, isNumber, isInteger, isBoolean, isFunction, isObject, isArray, isPromise
 *
 * Multiple type checking and fixing:
 *   getType, isType, isPrimitive, toJavaScriptType, toSchemaType, _convertToPromise
 *
 * Typescript types and interfaces:
 *   SchemaPrimitiveType, SchemaType, JavaScriptPrimitiveType, JavaScriptType,
 *   PrimitiveValue, PlainObject, IValidatorFn, AsyncIValidatorFn
 *
 * Note: 'IValidatorFn' is short for 'invertable validator function',
 *   which is a validator functions that accepts an optional second
 *   argument which, if set to TRUE, causes the validator to perform
 *   the opposite of its original finction.
 */

export type SchemaPrimitiveType =
  'string' | 'number' | 'integer' | 'boolean' | 'null';
export type SchemaType =
  'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array';
export type JavaScriptPrimitiveType =
  'string' | 'number' | 'boolean' | 'null' | 'undefined';
export type JavaScriptType =
  'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'object' | 'array' |
  'arguments' | 'date' | 'error' | 'function' | 'json' | 'math' | 'regexp'
export type PrimitiveValue = string | number | boolean | null | undefined;
export type PlainObject = { [k: string]: any };

export interface IValidatorFn { (c: AbstractControl, i?: boolean): PlainObject; }
export interface AsyncIValidatorFn { (c: AbstractControl, i?: boolean): any; }

/**
 * '_executeValidators' utility function
 *
 * Validates a control against an array of validators, and returns
 * an array of the same length containing a combination of error messages
 * (from invalid validators) and null values (from valid validators)
 *
 * @param {AbstractControl} control - control to validate
 * @param {IValidatorFn[]} validators - array of validators
 * @return {any[]} - array of nulls and error message
 */
export function _executeValidators(
  control: AbstractControl, validators: IValidatorFn[], invert: boolean = false
): PlainObject[] {
  return validators.map(validator => validator(control, invert));
}

/**
 * '_executeAsyncValidators' utility function
 *
 * Validates a control against an array of async validators, and returns
 * an array of observabe results of the same length containing a combination of
 * error messages (from invalid validators) and null values (from valid ones)
 *
 * @param {AbstractControl} control - control to validate
 * @param {AsyncIValidatorFn[]} validators - array of async validators
 * @return {any[]} - array of observable nulls and error message
 */
export function _executeAsyncValidators(
  control: AbstractControl, validators: AsyncIValidatorFn[], invert: boolean = false
): any[] {
  return validators.map(v => v(control, invert));
}

/**
 * '_mergeObjects' utility function
 *
 * Recursively Merges one or more objects into a single object with combined keys.
 * Automatically detects and ignores null and undefined inputs.
 * Also detects duplicated boolean 'not' keys and XORs their values.
 *
 * @param {PlainObject[]} object - one or more objects to merge
 * @return {PlainObject} - merged object
 */
export function _mergeObjects(...object: PlainObject[]): PlainObject {
  let mergedObject: PlainObject = {};
  for (let i = 0, l = arguments.length; i < l; i++) {
    let currentObject = arguments[i];
    forOwn(currentObject, (newValue, key) => {
      let OldValue = mergedObject[key];
      if (isPresent(OldValue)) {
        if (key === 'not' &&
          isBoolean(OldValue, 'strict') && isBoolean(newValue, 'strict')
        ) {
          mergedObject[key] = xor(OldValue, newValue);
        } else if (
          getType(OldValue) === 'object' && getType(newValue) === 'object'
        ) {
          mergedObject[key] = _mergeObjects(OldValue, newValue);
        } else {
          mergedObject[key] = newValue;
        }
      } else {
        mergedObject[key] = newValue;
      }
    });
  }
  return mergedObject;
}

/**
 * '_mergeErrors' utility function
 *
 * Merges an array of objects.
 * Used for combining the validator errors returned from 'executeValidators'
 *
 * @param {PlainObject[]} arrayOfErrors - array of objects
 * @return {PlainObject} - merged object, or null if no usable input objectcs
 */
export function _mergeErrors(arrayOfErrors: PlainObject[]): PlainObject {
  let mergedErrors: PlainObject = _mergeObjects.apply(arrayOfErrors);
  return isEmpty(mergedErrors) ? null : mergedErrors;
}

/**
 * 'isPresent' utility function
 *
 * Opposite of 'isBlank' function
 * Checks if a variable contains a value of any type.
 * Returns true even for otherwise 'falsey' values of 0, '', and false.
 *
 * @param {any} object - the value to check
 * @return {boolean} - false if undefined or null, otherwise true
 */
export function isPresent(value: any): boolean {
  return value !== undefined && value !== null;
}

/**
 * 'isBlank' utility function
 *
 * Opposite of 'isPresent' function
 * Checks if a variable does not contain a value of any type.
 * Returns false even for otherwise 'falsey' values of 0, '', and false.
 *
 * @param {any} object - the value to check
 * @return {boolean} - true if undefined or null, otherwise false
 */
export function isBlank(value: any): boolean {
  return value === undefined || value === null;
}

/**
 * 'isSet' utility function
 *
 * Opposite of 'isNotSet' function
 * Checks if a variable contains a value.
 * Returs false for null, undefined, or a zero-length strng, '',
 * otherwise returns true.
 * (Stricter than 'isPresent' because it also returns false for '',
 * though it stil returns true for otherwise 'falsey' values 0 and false.)
 *
 * @param {any} object - the value to check
 * @return {boolean} - false if undefined, null, or '', otherwise true
 */
export function isSet(value: any): boolean {
  return value !== undefined && value !== null && value !== '';
}

/**
 * 'isNotSet' utility function
 *
 * Opposite of 'isSet' function
 * Checks if a variable does not contain a value.
 * Returs true for null, undefined, or a zero-length strng, '',
 * otherwise returns false.
 * (Stricter than 'isBlank' because it also returns true for '',
 * though it stil returns false for otherwise 'falsey' values 0 and false.)
 *
 * @param {any} object - the value to check
 * @return {boolean} - false if undefined, null, or '', otherwise true
 */
export function isNotSet(value: any): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * 'isEmpty' utility function
 *
 * Similar to isNotSet, but also returns true for empty arrays and objects.
 *
 * @param {any} object - the value to check
 * @return {boolean} - false if undefined, null, or '', otherwise true
 */
export function isEmpty(value: any): boolean {
  if (getType(value) === 'array') return !value.length;
  if (getType(value) === 'object') return !Object.keys(value).length;
  return value === undefined || value === null || value === '';
}

/**
 * 'isNotEmpty' utility function
 *
 * Similar to isSet, but also returns true for non-empty arrays and objects.
 *
 * @param {any} object - the value to check
 * @return {boolean} - true if undefined, null, or '', otherwise false
 */
export function isNotEmpty(value: any): boolean {
  if (getType(value) === 'array') return !!value.length;
  if (getType(value) === 'object') return !!Object.keys(value).length;
  return value !== undefined && value !== null && value !== '';
}

/**
 * 'isString' utility function
 *
 * Checks if a value is a string.
 *
 * @param {any} object - the value to check
 * @return {boolean} - true if string, false if not
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * 'isNumber' utility function
 *
 * Checks if a value is a regular number or a numeric string.
 *
 * @param {any} object - the value to check
 * @param {any = false} strict - if truthy, also checks JavaScript tyoe
 * @return {boolean} - true if number, false if not
 */
export function isNumber(value: any, strict: any = false): boolean {
  if (strict && typeof value !== 'number') return false;
  return !isNaN(value) &&  value !== value / 0;
}

/**
 * 'isInteger' utility function
 *
 * Checks if a value is an integer.
 *
 * @param {any} object - the value to check
 * @param {any = false} strict - if truthy, also checks JavaScript tyoe
 * @return {boolean} - true if number, false if not
 */
export function isInteger(value: any, strict: any = false): boolean {
  if (strict && typeof value !== 'number') return false;
  return !isNaN(value) &&  value !== value / 0 && value % 1 === 0;
}

/**
 * 'isBoolean' utility function
 *
 * Checks if a value is a boolean.
 *
 * @param {any} object - the value to check
 * @param {any = null} option - if 'strict', also checks JavaScript type
 *                              if TRUE or FALSE, checks only for that value
 * @return {boolean} - true if boolean, false if not
 */
export function isBoolean(value: any, option: any = null): boolean {
  if (option === 'strict') return value === true || value === false;
  if (option === true) return value === true || value === 1 ||
    value === 'true' || value === '1';
  if (option === false) return value === false || value === 0 ||
    value === 'false' || value === '0';
  return value === true || value === 1 || value === 'true' || value === '1' ||
    value === false || value === 0 || value === 'false' || value === '0';
}

export function isFunction(item: any): boolean {
  return typeof item === 'function';
}

export function isObject(item: any): boolean {
  return item !== null && typeof item === 'object' &&
    Object.prototype.toString.call(item) === '[object Object]';
}

export function isArray(item: any): boolean {
  return Array.isArray(item) ||
    Object.prototype.toString.call(item) === '[object Array]';
}

/**
 * 'getType' function
 *
 * Detects the JSON Schema Type of a value.
 * Detects numbers and integers even if formatted as strings.
 * (So all integers are also numbers, and any number may also be a string.)
 * Only detects true boolean values (to detect boolean values
 * in non-boolean formats, use isBoolean() instead).
 *
 * Examples:
 * getType('10.5') = 'number'
 * getType('10') = 'integer'
 * getType('true') = 'string'
 * getType(true) = 'boolean'
 * getType(null) = 'null'
 * getType({}) = 'object'
 * getType([]) = 'array'
 *
 * @param {any} value - value to check
 * @return {boolean}
 */
export function getType(value: any): SchemaType {
  if (isBlank(value)) return 'null';
  if (isArray(value)) return 'array';
  if (isObject(value)) return 'object';
  if (isBoolean(value, 'strict')) return 'boolean';
  if (isInteger(value)) return 'integer';
  if (isNumber(value)) return 'number';
  if (isString(value)) return 'string';
  return null;
}

/**
 * 'isType' function
 *
 * Checks wether an input (probably string) value contains data of
 * a specified JSON Schema type
 *
 * @param {PrimitiveValue} value - value to check
 * @param {SchemaPrimitiveType} type - type to check
 * @return {boolean}
 */
export function isType(value: PrimitiveValue, type: SchemaPrimitiveType): boolean {
  switch (type) {
    case 'string':
      return isString(value);
    case 'number':
      return isNumber(value);
    case 'integer':
      return isInteger(value);
    case 'boolean':
      return isBoolean(value);
    case 'null':
      return !isSet(value);
    default:
      console.error(`'${type}' is not a recognized type.`);
      return null;
  }
}

/**
 * 'isPrimitive' function
 *
 * Checks wether an input value is a JavaScript primitive type:
 * string, number, boolean, or null.
 *
 * @param {any} value - value to check
 * @return {boolean}
 */
export function isPrimitive(value: any): boolean {
  return (isString(value) || isNumber(value) ||
    isBoolean(value, 'strict') || value === null);
}

/**
 * 'toJavaScriptType' function
 *
 * Converts an input (probably string) value to a JavaScript primitive type -
 * 'string', 'number', 'boolean', or 'null' - before storing in a JSON object.
 *
 * Does not coerce values (other than null), and only converts the types
 * of values that would otherwise be valid.
 *
 * If the optional third parameter 'checkIntegers' is TRUE, and the
 * JSON Schema type 'integer' is specified, it verifies the input
 * is an integer value and, if it is, returns it as a JaveScript number.
 * If 'checkIntegers' is FALSE, or not set, the type 'integer' is treated
 * exactly the same as 'number', and allows decimals.
 *
 * Examples:
 * toJavaScriptType('10', 'number') = 10
 * toJavaScriptType('10', 'integer') = 10
 * toJavaScriptType('10.5', 'number') = 10.5
 * toJavaScriptType('10.5', 'integer') = null // '10.5' is not an integer
 * toJavaScriptType(10.5, 'integer') = null // 10.5 is still not an integer
 *
 * @param {PrimitiveValue} value - value to convert
 * @param {SchemaPrimitiveType | SchemaPrimitiveType[]} type(s) - type to convert to
 * @param {boolean = false} checkIntegers - if FALSE, treat integers as numbers
 * @return {boolean}
 */
export function toJavaScriptType(
  value: any,
  type: SchemaPrimitiveType | SchemaPrimitiveType[],
  checkIntegers: boolean = false
): PrimitiveValue {
  if (isBlank(value)) return null;
  if (isString(type)) type = [type];
  if (checkIntegers && inArray('integer', type)) {
    if (isInteger(value, 'strict')) return value;
    if (isInteger(value)) return parseInt(value, 10);
  }
  if (inArray('number', type)) {
    if (isNumber(value, 'strict')) return value;
    if (isNumber(value)) return parseFloat(value);
  }
  if (inArray('string', type)) {
    if (isString(value)) return value;
  }
  if (inArray('boolean', type)) {
    if (isBoolean(value, true)) return true;
    if (isBoolean(value, false)) return false;
  }
  return null;
}

/**
 * 'toSchemaType' function
 *
 * Converts an input (probably string) value to the "best" JavaScript
 * equivalent available from an allowed list of JSON Schema types, which may
 * contain 'string', 'number', 'integer', 'boolean', and/or 'null'.
 * If necssary, does progressively agressive type coersion.
 * Will not return null unless null is in the list of allowed types.
 *
 * Number conversion examples:
 * toSchemaType('10', ['number','integer','string']) = 10 // integer
 * toSchemaType('10', ['number','string']) = 10 // number
 * toSchemaType('10', ['string']) = '10' // string
 * toSchemaType('10.5', ['number','integer','string']) = 10.5 // number
 * toSchemaType('10.5', ['integer','string']) = '10.5' // string
 * toSchemaType('10.5', ['integer']) = 10 // integer
 * toSchemaType(10.5, ['null','boolean','string']) = '10.5' // string
 * toSchemaType(10.5, ['null','boolean']) = true // boolean
 *
 * String conversion examples:
 * toSchemaType('1.5x', ['boolean','number','integer','string']) = '1.5x' // string
 * toSchemaType('1.5x', ['boolean','number','integer']) = '1.5' // number
 * toSchemaType('1.5x', ['boolean','integer']) = '1' // integer
 * toSchemaType('1.5x', ['boolean']) = true // boolean
 * toSchemaType('xyz', ['number','integer','boolean','null']) = true // boolean
 * toSchemaType('xyz', ['number','integer','null']) = null // null
 * toSchemaType('xyz', ['number','integer']) = 0 // number
 *
 * Boolean conversion examples:
 * toSchemaType('1', ['integer','number','string','boolean']) = 1 // integer
 * toSchemaType('1', ['number','string','boolean']) = 1 // number
 * toSchemaType('1', ['string','boolean']) = '1' // string
 * toSchemaType('1', ['boolean']) = true // boolean
 * toSchemaType('true', ['number','string','boolean']) = 'true' // string
 * toSchemaType('true', ['boolean']) = true // boolean
 * toSchemaType('true', ['number']) = 0 // number
 * toSchemaType(true, ['number','string','boolean']) = true // boolean
 * toSchemaType(true, ['number','string']) = 'true' // string
 * toSchemaType(true, ['number']) = 1 // number
 *
 * @param {PrimitiveValue} value - value to convert
 * @param {SchemaPrimitiveType[]} types - allowed types to convert to
 * @return {boolean}
 */
export function toSchemaType(
  value: PrimitiveValue, types: SchemaPrimitiveType | SchemaPrimitiveType[]
): PrimitiveValue {
  if (!isArray(<SchemaPrimitiveType>types)) types = <SchemaPrimitiveType[]>[types];
  if ((<SchemaPrimitiveType[]>types).indexOf('null') !== -1 && !isSet(value)) {
    return null;
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('boolean') !== -1 && !isBoolean(value, 'strict')) {
    return value;
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('integer') !== -1) {
    let testValue = toJavaScriptType(value, 'integer');
    if (testValue !== null) return +testValue;
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('number') !== -1) {
    let testValue = toJavaScriptType(value, 'number');
    if (testValue !== null) return +testValue;
  }
  if (
    (isString(value) || isNumber(value, 'strict')) &&
    (<SchemaPrimitiveType[]>types).indexOf('string') !== -1
  ) { // Convert number to string
    return toJavaScriptType(value, 'string');
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('boolean') !== -1 && isBoolean(value)) {
    return toJavaScriptType(value, 'boolean');
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('string') !== -1) { // Convert null & boolean to string
    if (value === null) return '';
    let testValue = toJavaScriptType(value, 'string');
    if (testValue !== null) return testValue;
  }
  if ((
    (<SchemaPrimitiveType[]>types).indexOf('number') !== -1 ||
    (<SchemaPrimitiveType[]>types).indexOf('integer') !== -1)
  ) {
    if (value === true) return 1; // Convert boolean & null to number
    if (value === false || value === null || value === '') return 0;
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('number') !== -1) { // Convert mixed string to number
    let testValue = parseFloat(<string>value);
    if (!!testValue) return testValue;
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('integer') !== -1) { // Convert string or number to integer
    let testValue = parseInt(<string>value, 10);
    if (!!testValue) return testValue;
  }
  if ((<SchemaPrimitiveType[]>types).indexOf('boolean') !== -1) { // Convert anything to boolean
    return !!value;
  }
  if ((
      (<SchemaPrimitiveType[]>types).indexOf('number') !== -1 ||
      (<SchemaPrimitiveType[]>types).indexOf('integer') !== -1
    ) && (<SchemaPrimitiveType[]>types).indexOf('null') === -1
  ) {
    return 0; // If null not allowed, return 0 for non-convertable values
  }
}

/**
 * 'isPromise' function
 *
 * @param {object} object
 * @return {object}
 */
export function isPromise(object: any): object is Promise<any> {
  return !!object && typeof object.then === 'function';
}

/**
 * '_convertToPromise' function
 *
 * @param {object} object
 * @return {Promise<any>}
 */
export function _convertToPromise(object: any): Promise<any> {
  return isPromise(object) ? object : toPromise.call(object);
}
