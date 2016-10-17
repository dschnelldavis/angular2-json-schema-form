import { AbstractControl } from '@angular/forms';
import { toPromise } from 'rxjs/operator/toPromise';

export type SchemaPrimitiveType =
  'string' | 'number' | 'integer' | 'boolean' | 'null';
export type SchemaType =
  'string' | 'number' | 'integer' | 'boolean' | 'null' | 'array' | 'object';
export type PrimitiveValue = string | number | boolean | null | undefined;
export type PlainObject = { [key: string]: any };

// Note: IValidatorFn = Invertable validator function
export interface IValidatorFn { (c: AbstractControl, i?: boolean): PlainObject; }
export interface AsyncIValidatorFn { (c: AbstractControl, i?: boolean): any; }

/**
 * 'JsonValidators' module
 *
 * Provides an extended set of validators to be used by form controls,
 * compatible with standard JSON Schema validation options.
 * http://json-schema.org/latest/json-schema-validation.html
 *
 * Note: This library is designed as a drop-in replacement for the Angular 2
 * Validators library, and except for one small breaking change to the 'pattern'
 * validator (described below) it can even be imported as a substitute, like so:
 *
 *   import { JsonValidators as Validators } from 'json-validators';
 *
 * and it should work with existing code as a complete replacement.
 *
 * The one exception is the 'pattern' validator, which has been changed to
 * matche partial values by default (the standard 'pattern' validator wrapped
 * all patterns in '^' and '$', forcing them to always match an entire value).
 * However, the old behavior can be restored by simply adding '^' and '$'
 * around your patterns, or by passing an optional second parameter of TRUE.
 *
 * This library replaces Angular 2's four validators and one validator combination
 * function with the following 16 validators and 4 transformation functions:
 *
 * Validators:
 * For all formControls:     required (*), type, enum
 * For text formControls:    minLength (*), maxLength (*), pattern (*), format
 * For numeric formControls: minimum, maximum, multipleOf
 * For formGroup objects:    minProperties, maxProperties, dependencies
 * For formArray arrays:     minItems, maxItems, uniqueItems
 * (Validators originally included with Angular 2 are maked with (*).)
 *
 * NOTE: The dependencies validator is not complete.
 * NOTE: The enum validator currently only works with primitive values
 *   (text, numbers, booleans). It does not yet work with objects or arrays.
 *
 * Validator transformation functions:
 *   composeAnyOf, composeOneOf, composeAllOf, composeNot
 * (Angular 2's original combination funciton, compose, is also included for
 * backward compatibility, though it is essentially equivalent to composeAllOf.)
 *
 * All validators have also been extended to accept an optional second argument
 * which, if passed a TRUE value, causes the validator to perform the opposite
 * of its original finction. (This is used internally to enable 'not' and
 * 'composeOneOf' to function and return useful errors.)
 *
 * The 'required' validator has also been overloaded so that if called with
 * a boolean parameter (or no parameters) it returns the original validator
 * function (rather than executing it). However, if it is called with an
 * AbstractControl parameter (as was previously required), it behaves
 * exactly as before.
 *
 * This enables all validators (including 'required') to be constructed in
 * exactly the same way, so they can be automatically applied using the
 * equivalent key names and values taken directly from a JSON Schema.
 *
 * This module also includes several helper utility functions:
 * Functions for processing validators and errors:
 *   _executeValidators, _executeAsyncValidators, _mergeObjects, _mergeErrors
 * Individual value checking functions: isPresent, isBlank, isSet, isNotSet
 * Individual type checking functions:  isString, isNumber, isInteger, isBoolean
 * Multiple type checking functions:    isType, toJavaScriptType, toSchemaType
 * Other functions:                     xor, isPromise, _convertToPromise
 *
 * This source code is partially derived from Angular 2,
 * which is Copyright (c) 2014-2016 Google, Inc.
 * Use of this source code is therefore governed by the same MIT-style license
 * that can be found in the LICENSE file at https://angular.io/license
 */

export class JsonValidators {

  /**
   * Validator functions:
   *
   * For all formControls:     required, type, enum
   * For text formControls:    minLength, maxLength, pattern, format
   * For numeric formControls: minimum, maximum, multipleOf
   * For formGroup objects:    minProperties, maxProperties, dependencies
   * For formArray arrays:     minItems, maxItems, uniqueItems
   *
   * TODO: finish dependencies validator
   * TODO: update enum to work with formGroup objects and formArray arrays
   */

  /**
   * 'required' validator
   *
   * This validator is overloaded, compared to the default required validator.
   * If called with no parameters, or TRUE, this validator returns the
   * 'required' validator function (rather than executing it). This matches
   * the behavior of all other validators in this library.
   *
   * If this validator is called with an AbstractControl parameter
   * (as was previously required) it behaves the same as Angular 2's default
   * required validator, and returns an error if the control is empty.
   *
   * Old behavior: (if input type = AbstractControl)
   * @param {AbstractControl} control - required control
   * @return {{[key: string]: boolean}} - returns error message if no input
   *
   * New behavior: (if no input, or input type = boolean)
   * @param {boolean = true} required? - true to validate, false to disable
   * @return {IValidatorFn} - returns the 'required' validator function itself
   */
  static required(input: AbstractControl): PlainObject;
  static required(input?: boolean): IValidatorFn;

  static required(input?: AbstractControl | boolean): PlainObject | IValidatorFn {
    if (input === undefined) input = true;
    switch (input) {
      case true: // Return required function (do not execute it yet)
        return (control: AbstractControl, invert: boolean = false): PlainObject => {
          if (invert) return null; // if not required, always return valid
          return isSet(control.value) ? null : { 'required': true };
        };
      case false: // Do nothing
        return (control: AbstractControl): PlainObject => null;
      default: // Execute required function
        return isSet((<AbstractControl>input).value) ?
          null : { 'required': true };
    }
  };

  /**
   * 'type' validator
   *
   * Requires a control to only accept values of a specified type,
   * or one of an array of types.
   *
   * Note: SchemaPrimitiveType = 'string'|'number'|'integer'|'boolean'|'null'
   *
   * @param {SchemaPrimitiveType | SchemaPrimitiveType[]} type - type(s) to accept
   * @return {IValidatorFn}
   */
  static type(type: SchemaPrimitiveType | SchemaPrimitiveType[]): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualValue: any = control.value;
      let typeArray: SchemaPrimitiveType[] = Array.isArray(type) ? type : [type];
      let isValid: boolean = false;
      for (let i = 0, l = typeArray.length; i < l; i++) {
        let typeValue: SchemaPrimitiveType = typeArray[i];
        if (isType(actualValue, typeValue) === true) {
          isValid = true; break;
        }
      }
      return xor(isValid, invert) ?
        null : { 'type': { type, actualValue } };
    };
  }

  /**
   * 'enum' validator
   *
   * Requires a control to have a value from an enumerated list of values.
   *
   * Converts types as needed to allow string inputs to still correctly
   * match number, boolean, and null enum values.
   * (toJavaScriptType() can be used later to convert these string values.)
   *
   * TODO: modify to work with objects and arrays
   *
   * @param {PrimitiveValue[]} enumList - array of acceptable values
   * @return {IValidatorFn}
   */
  static enum(enumList: PrimitiveValue[]): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let isValid: boolean = false;
      let actualValue: PrimitiveValue = control.value;
      for (let i = 0, l = enumList.length; i < l; i++) {
        let enumValue: PrimitiveValue = enumList[i];
        if (actualValue === enumValue) {
          isValid = true; break;
        } else if (
          isNumber(enumValue) &&
          parseFloat(<string>actualValue) === parseFloat(<string>enumValue)
        ) {
          isValid = true; break;
        } else if (
          isBoolean(enumValue, 'strict') &&
          toJavaScriptType(actualValue, 'boolean') === enumValue
        ) {
          isValid = true; break;
        } else if (enumValue === null && isNotSet(actualValue)) {
          isValid = true; break;
        }
      }
      return xor(isValid, invert) ?
        null : { 'enum': { 'enum': enumList, actualValue } };
    };
  }

  /**
   * 'minLength' validator
   *
   * Requires a control's text value to be greater than a specified length.
   *
   * @param {number} requiredLength - minimum allowed string length
   * @param {boolean = false} invert - instead return error object only if valid
   * @return {IValidatorFn}
   */
  static minLength(requiredLength: number): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualLength: number = control.value.length;
      let isValid: boolean = actualLength <= requiredLength;
      return xor(isValid, invert) ?
        null :
        { 'minlength': { requiredLength, actualLength } };
    };
  };

  /**
   * 'maxLength' validator
   *
   * Requires a control's text value to be less than a specified length.
   *
   * @param {number} requiredLength - maximum allowed string length
   * @param {boolean = false} invert - instead return error object only if valid
   * @return {IValidatorFn}
   */
  static maxLength(requiredLength: number): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualLength: number = control.value.length;
      let isValid: boolean = actualLength <= requiredLength;
      return xor(isValid, invert) ?
        null :
        { 'maxlength': { requiredLength, actualLength } };
    };
  };

  /**
   * 'pattern' validator
   *
   * Note: NOT the same as Angular 2's default pattern validator.
   * Requires a control's value to match a specified regular expression pattern.
   *
   * This validator changes the behavior of default pattern validator
   * by replacing RegExp(`^${pattern}$`) with RegExp(`${pattern}`),
   * which allows for partial matches.
   *
   * To return to the default funcitonality, and match the entire string,
   * pass TRUE as the optional second parameter.
   *
   * @param {string} pattern - regular expression pattern
   * @param {boolean = false} wholeString - match whole value string?
   * @return {IValidatorFn}
   */
  static pattern(pattern: string, wholeString: boolean = false): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let requiredPattern: string = wholeString ? `^${pattern}$` : pattern;
      let regex = new RegExp(requiredPattern);
      let actualValue: string = control.value;
      let isValid: boolean = regex.test(actualValue);
      return xor(isValid, invert) ?
        null : { 'pattern': { requiredPattern, wholeString, actualValue } };
    };
  }

  /**
   * 'format' validator
   *
   * Requires a control to have a value of a certain format.
   *
   * This validator currently checks the following formsts:
   * 'date-time'|'email'|'hostname'|'ipv4'|'ipv6'|'uri'
   *
   * TODO: add 'regex' format
   *
   * @param {'date-time'|'email'|'hostname'|'ipv4'|'ipv6'|'uri'} format - format to check
   * @return {IValidatorFn}
   */
  static format(
    format: 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri'
  ): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let isValid: boolean;
      let actualValue: string = control.value;
      if (typeof actualValue !== 'string' || actualValue.length === 0) {
        isValid = false;
      } else {
        switch (format) {
          case 'date-time':
            isValid = !!actualValue.match(/^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/);
            break;
          case 'email':
            let parts: string[] = actualValue.split('@');
            isValid =
              !!parts && parts.length === 2 &&
              !!parts[0].match(/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")$/)
              &&
              !!parts[1].match(/(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?/);
            break;
          case 'hostname':
            isValid = !!actualValue.match(/(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?/);
            break;
          case 'ipv4':
            isValid = !!actualValue.match(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
            break;
          case 'ipv6':
            isValid = !!actualValue.match(/(([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))/);
            break;
          case 'uri':
            isValid = !!actualValue.match(/^((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)$/);
            break;
          default:
            console.error(`'${format}' is not a recognized format.`)
            isValid = true;
        }
      }
      return xor(isValid, invert) ?
        null : { 'format': { format, actualValue } };
    };
  }

  /**
   * 'minimum' validator
   *
   * Requires a control to have a numeric value not greater than
   * a specified minimum amount.
   *
   * The optional second parameter indicates whether the valid range excludes
   * the minimum value. It defaults to false, and includes the minimum.
   *
   * @param {number} minimum - minimum allowed value
   * @param {boolean = false} exclusiveMinimum - include minimum value itself?
   * @return {IValidatorFn}
   */
  static minimum(minimum: number, exclusiveMinimum: boolean = false): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualValue: number = control.value;
      let isValid: boolean = isNumber(actualValue) &&
        exclusiveMinimum ? actualValue > minimum : actualValue >= minimum;
      return xor(isValid, invert) ?
        null : { 'minimum': { minimum, exclusiveMinimum, actualValue } };
    };
  }

  /**
   * 'maximum' validator
   *
   * Requires a control to have a numeric value not less than
   * a specified maximum amount.
   *
   * The optional second parameter indicates whether the valid range excludes
   * the maximum value. It defaults to false, and includes the maximum.
   *
   * @param {number} maximum - maximum allowed value
   * @param {boolean = false} exclusiveMaximum - include maximum value itself?
   * @return {IValidatorFn}
   */
  static maximum(maximum: number, exclusiveMaximum: boolean = false): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualValue: number = control.value;
      let isValid: boolean = isNumber(actualValue) &&
        exclusiveMaximum ? actualValue < maximum : actualValue <= maximum;
      return xor(isValid, invert) ?
        null : { 'maximum': { maximum, exclusiveMaximum, actualValue } };
    };
  }

  /**
   * 'multipleOf' validator
   *
   * Requires a control to have a numeric value that is a multiple
   * of a specified number.
   *
   * @param {number} multipleOf - number value must be a multiple of
   * @return {IValidatorFn}
   */
  static multipleOf(multipleOf: number): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualValue: number = control.value;
      let isValid: boolean = isNumber(actualValue) && actualValue % multipleOf === 0;
      return xor(isValid, invert) ?
        null : { 'multipleOf': { multipleOf, actualValue } };
    };
  }

  /**
   * 'minProperties' validator
   *
   * Requires a form group to have a minimum number of properties (i.e. have
   * values entered in a minimum number of controls within the group).
   *
   * @param {number} minProperties - minimum number of properties allowed
   * @return {IValidatorFn}
   */
  static minProperties(minProperties: number): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualProperties: number = 0;
      for (let key in control.value) {
        if (control.value.hasOwnProperty(key)) actualProperties++;
      }
      let isValid: boolean = actualProperties >= minProperties;
      return xor(isValid, invert) ?
        null : { 'minProperties': { minProperties, actualProperties } };
    };
  }

  /**
   * 'maxProperties' validator
   *
   * Requires a form group to have a maximum number of properties (i.e. have
   * values entered in a maximum number of controls within the group).
   *
   * Note: Has no effect if the form group does not contain more than the
   * maximum number of controls.
   *
   * @param {number} maxProperties - maximum number of properties allowed
   * @return {IValidatorFn}
   */
  static maxProperties(maxProperties: number): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualProperties: number = 0;
      for (let key in control.value) {
        if (control.value.hasOwnProperty(key)) actualProperties++;
      }
      let isValid: boolean = actualProperties <= maxProperties;
      return xor(isValid, invert) ?
        null : { 'maxProperties': { maxProperties, actualProperties } };
    };
  }

  /**
   * 'dependencies' validator
   *
   * Requires the controls in a form group to meet additional validation
   * criteria, depending on the values of other controls in the group.
   *
   * Examples:
   * https://spacetelescope.github.io/understanding-json-schema/reference/object.html#dependencies
   *
   * @param {any} dependencies - required dependencies
   * @return {IValidatorFn}
   */
  static dependencies(dependencies: any): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      if (getType(dependencies) !== 'object' || isEmpty(dependencies)) return null;
      let allErrors: PlainObject = _mergeObjects(
        forOwn(dependencies, (value, requiringField) => {
          if (isNotSet(control.value[requiringField])) return null;
          let requiringFieldErrors: PlainObject = {};
          let requiredFields: string[];
          let properties: PlainObject = {};
          if (getType(dependencies[requiringField]) === 'array') {
            requiredFields = dependencies[requiringField];
          } else if (getType(dependencies[requiringField]) === 'object') {
            requiredFields = dependencies[requiringField]['required'] || [];
            properties = dependencies[requiringField]['properties'] || {};
          }
          // Validate property dependencies
          for (let i = 0, l = requiredFields.length; i < l; i++) {
            let requiredField: string = requiredFields[i];
            if (xor(isNotSet(control.value[requiredField]), invert)) {
              requiringFieldErrors[requiredField] = { 'required': true };
            }
          }
          // Validate schema dependencies
          requiringFieldErrors = _mergeObjects(requiringFieldErrors,
            forOwn(properties, (requirements, requiredField) => {
              let requiredFieldErrors: PlainObject = _mergeObjects(
                forOwn(requirements, (requirement, parameter) => {
                  let validator: IValidatorFn = null;
                  if (requirement === 'maximum' || requirement === 'minimum') {
                    let exclusive: boolean =
                      !!requirements['exclusiveM' + requirement.slice(1)];
                    validator = JsonValidators[requirement](parameter, exclusive);
                  } else if (typeof JsonValidators[requirement] === 'function') {
                    validator = JsonValidators[requirement](parameter);
                  }
                  return isBlank(validator) ?
                    null : validator(control.value[requiredField]);
                })
              );
              return isEmpty(requiredFieldErrors) ?
                null : { [requiredField]: requiredFieldErrors };
            })
          );
          return isEmpty(requiringFieldErrors) ?
            null : { [requiringField]: requiringFieldErrors };
        })
      );
      return isEmpty(allErrors) ? null : allErrors;
    };
  }

  /**
   * 'minItems' validator
   *
   * Requires a form array to have a minimum number of values.
   *
   * @param {number} minItems - minimum number of items allowed
   * @return {IValidatorFn}
   */
  static minItems(minItems: number): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualItems: number = control.value.length;
      let isValid: boolean = actualItems >= minItems;
      return xor(isValid, invert) ?
        null : { 'minItems': { minItems, actualItems } };
    };
  }

  /**
   * 'maxItems' validator
   *
   * Requires a form array to have a maximum number of values.
   *
   * @param {number} maxItems - maximum number of items allowed
   * @return {IValidatorFn}
   */
  static maxItems(maxItems: number): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let actualItems: number = control.value.length;
      let isValid: boolean = actualItems <= maxItems;
      return xor(isValid, invert) ?
        null : { 'maxItems': { maxItems, actualItems } };
    };
  }

  /**
   * 'uniqueItems' validator
   *
   * Requires values in a form array to be unique.
   *
   * @param {boolean = true} unique? - true to validate, false to disable
   * @return {IValidatorFn}
   */
  static uniqueItems(unique: boolean = true): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (!unique) return null;
      if (isPresent(JsonValidators.required(control))) return null;
      let sorted: any[] = control.value.slice().sort();
      let duplicateItems = [];
      for (let i = 1, l = sorted.length; i < l; i++) {
        if (
          sorted[i - 1] === sorted[i] && duplicateItems.indexOf(sorted[i]) !== -1
        ) {
          duplicateItems.push(sorted[i]);
        }
      }
      let isValid: boolean = !duplicateItems.length;
      return xor(isValid, invert) ?
        null : { 'uniqueItems': { duplicateItems } };
    };
  }

  /**
   * No-op validator. Included for backward compatibility.
   */
  static nullValidator(c: AbstractControl): PlainObject { return null; }

  /**
   * Validator transformation functions:
   * composeAnyOf, composeOneOf, composeAllOf, composeNot,
   * compose, composeAsync
   *
   * TODO: Add composeAnyOfAsync, composeOneOfAsync,
   *   composeAllOfAsync, composeNotAsync
   */

  /**
   * 'composeAnyOf' validator combination function
   *
   * Accepts an array of validators and returns a single validator that
   * evaluates to valid if any one or more of the submitted validators are
   * valid. If every validator is invalid, it returns combined errors from
   * all validators.
   *
   * @param {IValidatorFn[]} validators - array of validators to combine
   * @return {IValidatorFn} - single combined validator function
   */
  static composeAnyOf(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) return null;
    let presentValidators: IValidatorFn[] = validators.filter(isPresent);
    if (presentValidators.length === 0) return null;
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      let arrayOfErrors: PlainObject[] =
        _executeValidators(control, presentValidators, invert).filter(isPresent);
      let isValid: boolean = validators.length > arrayOfErrors.length;
      return xor(isValid, invert) ?
        null : _mergeObjects.apply(arrayOfErrors.concat({ 'anyOf': !invert }));
    };
  }

  /**
   * 'composeOneOf' validator combination function
   *
   * Accepts an array of validators and returns a single validator that
   * evaluates to valid only if exactly one of the submitted validators
   * is valid. Otherwise returns combined information from all validators,
   * both valid and invalid.
   *
   * @param {IValidatorFn[]} validators - array of validators to combine
   * @return {IValidatorFn} - single combined validator function
   */
  static composeOneOf(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) return null;
    let presentValidators: IValidatorFn[] = validators.filter(isPresent);
    if (presentValidators.length === 0) return null;
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      let arrayOfErrors: PlainObject[] =
        _executeValidators(control, presentValidators);
      let validControls: number =
        validators.length - arrayOfErrors.filter(isPresent).length;
      let isValid: boolean = validControls === 1;
      if (xor(isValid, invert)) return null;
      let arrayOfValids: PlainObject[] =
        _executeValidators(control, presentValidators, invert);
      return _mergeObjects.apply(
        arrayOfErrors.concat(arrayOfValids).concat({ 'oneOf': !invert })
      );
    };
  }

  /**
   * 'composeAllOf' validator combination function
   *
   * Accepts an array of validators and returns a single validator that
   * evaluates to valid only if all the submitted validators are individually
   * valid. Otherwise it returns combined errors from all invalid validators.
   *
   * @param {IValidatorFn[]} validators - array of validators to combine
   * @return {IValidatorFn} - single combined validator function
   */
  static composeAllOf(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) return null;
    let presentValidators: IValidatorFn[] = validators.filter(isPresent);
    if (presentValidators.length === 0) return null;
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      let combinedErrors = _mergeErrors(
        _executeValidators(control, presentValidators, invert)
      );
      let isValid: boolean = combinedErrors === null;
      return (xor(isValid, invert)) ?
        null : _mergeObjects(combinedErrors, { 'allOf': !invert });
    };
  }

  /**
   * 'composeNot' validator inversion function
   *
   * Accepts a single validator function and inverts its result.
   * Returns valid if the submitted validator is invalid, and
   * returns invalid if the submitted validator is valid.
   * (Note: this function can itself be inverted
   * - e.g. composeNot(composeNot(validator)) -
   * but this can be confusing and is therefore not recommended.)
   *
   * @param {IValidatorFn[]} validators - validator to invert
   * @return {IValidatorFn} - new validator function that returns opposite result
   */
  static composeNot(validator: IValidatorFn): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isPresent(JsonValidators.required(control))) return null;
      let error: PlainObject = validator(control, !invert);
      let isValid: boolean = error === null;
      return (xor(isValid, invert)) ?
        null : _mergeObjects(error, { 'not': !invert });
    };
  }

  /**
   * 'compose' validator combination function
   *
   * @param {IValidatorFn[]} validators - array of validators to combine
   * @return {IValidatorFn} - single combined validator function
   */
  static compose(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) return null;
    let presentValidators = validators.filter(isPresent);
    if (presentValidators.length === 0) return null;
    return (control: AbstractControl, invert: boolean = false): PlainObject =>
      _mergeErrors(_executeValidators(control, presentValidators, invert));
  };

  /**
   * 'composeAsync' async validator combination function
   *
   * @param {AsyncIValidatorFn[]} async validators - array of async validators
   * @return {AsyncIValidatorFn} - single combined async validator function
   */
  static composeAsync(validators: AsyncIValidatorFn[]): AsyncIValidatorFn {
    if (!validators) return null;
    let presentValidators = validators.filter(isPresent);
    if (presentValidators.length === 0) return null;
    return (control: AbstractControl, invert: boolean = false) => Promise.all(
      _executeAsyncValidators(control, presentValidators).map(_convertToPromise)
    ).then(_mergeErrors);
  }
}

/**
 * Utility functions:
 *
 * Validators and errors:
 *   _executeValidators, _executeAsyncValidators, _mergeObjects, _mergeErrors
 * Individual value checking: isPresent, isBlank, isSet, isNotSet
 * Individual type checking: isString, isNumber, isInteger, isBoolean
 * Multiple type checking: isType, toJavaScriptType, toSchemaType
 * Other: xor, isPromise, _convertToPromise
 */

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
function _executeValidators(
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
function _executeAsyncValidators(
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
function _mergeObjects(...object: PlainObject[]): PlainObject {
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
} //

/**
 * '_mergeErrors' utility function
 *
 * Merges an array of objects.
 * Used for combining the validator errors returned from 'executeValidators'
 *
 * @param {PlainObject[]} arrayOfErrors - array of objects
 * @return {PlainObject} - merged object, or null if no usable input objectcs
 */
function _mergeErrors(arrayOfErrors: PlainObject[]): PlainObject {
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
function isPresent(value: any): boolean {
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
function isBlank(value: any): boolean {
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
function isSet(value: any): boolean {
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
function isNotSet(value: any): boolean {
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
function isEmpty(value: any): boolean {
  if (getType(value) === 'array') return !value.length;
  if (getType(value) === 'object') return !Object.keys(value).length;
  return value === undefined || value === null || value === '';
}

/**
 * 'isString' utility function
 *
 * Checks if a value is a string.
 *
 * @param {any} object - the value to check
 * @return {boolean} - true if string, false if not
 */
function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * 'isNumber' utility function
 *
 * Checks if a value is a number or a numeric string.
 *
 * @param {any} object - the value to check
 * @param {any = false} strict - if truthy, also checks JavaScript tyoe
 * @return {boolean} - true if number, false if not
 */
function isNumber(value: any, strict: any = false): boolean {
  if (!!strict) return typeof value === 'number';
  return !isNaN(value);
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
function isInteger(value: any, strict: any = false): boolean {
  if (!!strict) return typeof value === 'number' && value % 1 === 0;
  return !isNaN(value) && value % 1 === 0;
}

/**
 * 'isBoolean' utility function
 *
 * Checks if a value is a boolean.
 *
 * @param {any} object - the value to check
 * @param {any = null} option - if 'strict', also checks JavaScript type
 *                              if true or false, checks only for that value
 * @return {boolean} - true if boolean, false if not
 */
function isBoolean(value: any, option: any = null): boolean {
  if (option === 'strict') return value === true || value === false;
  if (option === true) return value === true || value === 1 ||
    value === 'true' || value === '1';
  if (option === false) return value === false || value === 0 ||
    value === 'false' || value === '0';
  return value === true || value === 1 || value === 'true' || value === '1' ||
    value === false || value === 0 || value === 'false' || value === '0';
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
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
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
 * 'toJavaScriptType' function
 *
 * Converts an input (probably string) value to a specified JavaScript type -
 * 'string', 'number', 'boolean', or 'null' - before storing in a JSON object.
 * If the JSON Schema type 'integer' is specified, it verifies the input
 * is an integer value and returns it as a JaveScript number.
 *
 * Does not coerce values (other than null), and only converts the types
 * of values that would otherwise be valid.
 *
 * Examples:
 * toJavaScriptType('10', 'number') = 10
 * toJavaScriptType('10', 'integer') = 10
 * toJavaScriptType('10.5', 'number') = 10.5
 * toJavaScriptType('10.5', 'integer') = null // '10.5' is not an integer
 * toJavaScriptType(10.5, 'integer') = null // 10.5 is still not an integer
 *
 * @param {PrimitiveValue} value - value to convert
 * @param {SchemaPrimitiveType} type - type to convert to
 * @return {boolean}
 */
export function toJavaScriptType(
  value: any, type: SchemaPrimitiveType
): PrimitiveValue {
  if (isBlank(value)) return null;
  switch (type) {
    case 'string':
      if (isString(value)) return value;
      if (typeof value.toString === 'function') return value.toString;
      return null;
    case 'number':
      if (isNumber(value, 'strict')) return value;
      if (isNumber(value)) return parseFloat(value);
      return null;
    case 'integer':
      if (isInteger(value), 'strict') return value;
      if (isInteger(value)) return parseInt(value, 10);
      return null;
    case 'boolean':
      if (isBoolean(value, true)) return true;
      if (isBoolean(value, false)) return false;
      return null;
    case 'null':
      return null;
    default:
      console.error(`'${type}' is not a recognized type.`);
      return null;
  }
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
  value: PrimitiveValue, types: SchemaPrimitiveType[]
): PrimitiveValue {
  if (types.length === 1) return toJavaScriptType(value, types[0]);
  if (types.indexOf('null') !== -1 && !isSet(value)) {
    return null;
  }
  if (types.indexOf('boolean') !== -1 && !isBoolean(value, 'strict')) {
    return value;
  }
  if (types.indexOf('integer') !== -1) {
    let testValue = toJavaScriptType(value, 'integer');
    if (testValue !== null) return testValue;
  }
  if (types.indexOf('number') !== -1) {
    let testValue = toJavaScriptType(value, 'number');
    if (testValue !== null) return testValue;
  }
  if ((isString(value) || isNumber(value, 'strict')) &&
    types.indexOf('string') !== -1) { // Convert number to string
    return toJavaScriptType(value, 'string');
  }
  if (types.indexOf('boolean') !== -1 && isBoolean(value)) {
    return toJavaScriptType(value, 'boolean');
  }
  if (types.indexOf('string') !== -1) { // Convert null & boolean to string
    if (value === null) return '';
    let testValue = toJavaScriptType(value, 'string');
    if (testValue !== null) return testValue;
  }
  if ((types.indexOf('number') !== -1 || types.indexOf('integer') !== -1)) {
    if (value === true) return 1; // Convert boolean & null to number
    if (value === false || value === null || value === '') return 0;
  }
  if (types.indexOf('number') !== -1) { // Convert mixed string to number
    let testValue = parseFloat(<string>value);
    if (!!testValue) return testValue;
  }
  if (types.indexOf('integer') !== -1) { // Convert string or number to integer
    let testValue = parseInt(<string>value, 10);
    if (!!testValue) return testValue;
  }
  if (types.indexOf('boolean') !== -1) { // Convert anything to boolean
    return !!value;
  }
  if ((types.indexOf('number') !== -1 || types.indexOf('integer') !== -1)
    && types.indexOf('null') === -1) {
    return 0; // If null not allowed, return 0 for non-convertable values
  }
  return null;
}

/**
 * 'xor' utility function - exclusive or
 *
 * Returns true if exactly one of two values is truthy.
 *
 * @param {any} value1 - first value to check
 * @param {any} value2 - second value to check
 * @return {boolean} - true if exatly one in put is truthy, false if not
 */
function xor(value1: any, value2: any): boolean {
  return (!!value1 && !value2) || (!value1 && !!value2);
}

/**
 * 'forOwn' utility function
 *
 * Iterates through an object and calls a function on each key and value.
 * The function is called with three arguments: (value, key, object).
 * Returns a new object with the same keys as the original, but with the values
 * returned by the function.
 *
 * @param {object} object - the object to iterate through
 * @param {(v: string, k: any) => any} fn - the function to call
 * @return {PlainObject} - the resulting object
 */
function forOwn(
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
 * 'isPromise' function
 *
 * @param {object} object
 * @return {object}
 */
function isPromise(object: any): object is Promise<any> {
  return !!object && typeof object.then === 'function';
}

/**
 * '_convertToPromise' function
 *
 * @param {object} object
 * @return {Promise<any>}
 */
function _convertToPromise(object: any): Promise<any> {
  return isPromise(object) ? object : toPromise.call(object);
}
