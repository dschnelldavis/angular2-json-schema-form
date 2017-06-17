import { AbstractControl } from '@angular/forms';

import {
  _convertToPromise, _executeValidators, _executeAsyncValidators, _mergeObjects,
  _mergeErrors, isEmpty, isDefined, hasValue, isString, isNumber, isBoolean,
  isArray, getType, isType, toJavaScriptType, xor,
  SchemaPrimitiveType, PlainObject, IValidatorFn, AsyncIValidatorFn
} from './validator.functions';
import { forEachCopy } from './utility.functions';

/**
 * 'JsonValidators' class
 *
 * Provides an extended set of validators to be used by form controls,
 * compatible with standard JSON Schema validation options.
 * http://json-schema.org/latest/json-schema-validation.html
 *
 * Note: This library is designed as a drop-in replacement for the Angular
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
 * This change is to make the 'pattern' validator match the behavior of a
 * JSON Schema pattern, which allows partial matches, rather than the behavior
 * of an HTML input control pattern, which does not.
 *
 * This library replaces Angular's 4 validators and 1 validator combination
 * function with the following 16 validators and 4 transformation functions:
 *
 * Validators:
 * For all formControls:     required (*), type, enum
 * For text formControls:    minLength (*), maxLength (*), pattern (*), format
 * For numeric formControls: minimum, maximum, multipleOf
 * For formGroup objects:    minProperties, maxProperties, dependencies
 * For formArray arrays:     minItems, maxItems, uniqueItems
 * (Validators originally included with Angular are maked with (*).)
 *
 * NOTE: The dependencies validator is not complete.
 * NOTE: The enum validator does not yet work with objects.
 *
 * Validator transformation functions:
 *   composeAnyOf, composeOneOf, composeAllOf, composeNot
 * (Angular's original combination funciton, 'compose', is also included for
 * backward compatibility, though it is effectively equivalent to composeAllOf,
 * though with a more generic error message.)
 *
 * All validators have also been extended to accept an optional second argument
 * which, if passed a TRUE value, causes the validator to perform the opposite
 * of its original finction. (This is used internally to enable 'not' and
 * 'composeOneOf' to function and return useful error messages.)
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
 * This source code is partially derived from Angular,
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
   * TODO: update enum to work with formGroup objects
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
   * (as was previously required) it behaves the same as Angular's default
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
    if (input === undefined) { input = true; }
    switch (input) {
      case true: // Return required function (do not execute it yet)
        return (control: AbstractControl, invert: boolean = false): PlainObject => {
          if (invert) { return null; } // if not required, always return valid
          return hasValue(control.value) ? null : { 'required': true };
        };
      case false: // Do nothing
        return (control: AbstractControl): PlainObject => null;
      default: // Execute required function
        return hasValue((<AbstractControl>input).value) ?
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
      if (isEmpty(control.value)) { return null; }
      let actualValue: any = control.value;
      let typeArray: SchemaPrimitiveType[] = isArray(type) ?
        <SchemaPrimitiveType[]>type : [<SchemaPrimitiveType>type];
      let isValid: boolean = false;
      for (let typeValue of typeArray) {
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
   * TODO: modify to work with objects
   *
   * @param {any[]} enumList - array of acceptable values
   * @return {IValidatorFn}
   */
  static enum(enumList: any[]): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isEmpty(control.value)) { return null; }
      let isValid: boolean = true;
      let actualValues: any | any[] = (isArray(control.value)) ?
        control.value : [control.value];
      for (let i1 = 0, l1 = actualValues.length; i1 < l1; i1++) {
        let actualValue: any = actualValues[i1];
        let itemIsValid: boolean = false;
        for (let i2 = 0, l2 = enumList.length; i2 < l2; i2++) {
          let enumValue: any = enumList[i2];
          if (actualValue === enumValue) {
            itemIsValid = true; break;
          } else if (isNumber(enumValue) && +actualValue === +enumValue) {
            itemIsValid = true; break;
          } else if (
            isBoolean(enumValue, 'strict') &&
            toJavaScriptType(actualValue, 'boolean') === enumValue
          ) {
            itemIsValid = true; break;
          } else if (enumValue === null && !hasValue(actualValue)) {
            itemIsValid = true; break;
          }
        }
        if (!itemIsValid) { isValid = false; break; }
      }
      return xor(isValid, invert) ?
        null : { 'enum': { 'enum': enumList, 'actualValue': control.value } };
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
      if (isEmpty(control.value)) { return null; }
      let actualLength: number = isString(control.value) ? control.value.length : 0;
      let isValid: boolean = actualLength >= requiredLength;
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
      let actualLength: number = isString(control.value) ? control.value.length : 0;
      let isValid: boolean = actualLength <= requiredLength;
      return xor(isValid, invert) ?
        null :
        { 'maxlength': { requiredLength, actualLength } };
    };
  };

  /**
   * 'pattern' validator
   *
   * Note: NOT the same as Angular's default pattern validator.
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
      if (isEmpty(control.value)) { return null; }
      let actualValue: string = control.value;
      let requiredPattern: string = (wholeString) ? `^${pattern}$` : pattern;
      let regex = new RegExp(requiredPattern);
      let isValid: boolean = isString(actualValue) ? regex.test(actualValue) : false;
      return xor(isValid, invert) ?
        null : { 'pattern': { requiredPattern, actualValue } };
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
   * TODO: add 'regex' and 'color' formats
   *
   * @param {'date-time'|'email'|'hostname'|'ipv4'|'ipv6'|'uri'} format - format to check
   * @return {IValidatorFn}
   */
  static format(
    format: 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri' | 'url' | 'color'
  ): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isEmpty(control.value)) { return null; }
      let isValid: boolean;
      let actualValue: string = control.value;
      if (!isString(actualValue)) {
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
          case 'uri': case 'url':
            isValid = !!actualValue.match(/^((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)$/);
            break;
          case 'color':
            isValid = !!actualValue.match(/^#[A-Fa-f0-9]{6}$/);
            break;
          default:
            console.error(`format validator error: "${format}" is not a recognized format.`);
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
      if (isEmpty(control.value)) { return null; }
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
      if (isEmpty(control.value)) { return null; }
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
      if (isEmpty(control.value)) { return null; }
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
      if (isEmpty(control.value)) { return null; }
      let actualProperties: number = Object.keys(control.value).length || 0;
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
      let actualProperties: number = Object.keys(control.value).length || 0;
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
      if (isEmpty(control.value)) { return null; }
      if (getType(dependencies) !== 'object' || isEmpty(dependencies)) { return null; }
      let allErrors: PlainObject = _mergeObjects(
        forEachCopy(dependencies, (value, requiringField) => {
          if (!hasValue(control.value[requiringField])) { return null; }
          let requiringFieldErrors: PlainObject = { };
          let requiredFields: string[];
          let properties: PlainObject = { };
          if (getType(dependencies[requiringField]) === 'array') {
            requiredFields = dependencies[requiringField];
          } else if (getType(dependencies[requiringField]) === 'object') {
            requiredFields = dependencies[requiringField]['required'] || [];
            properties = dependencies[requiringField]['properties'] || { };
          }

          // Validate property dependencies
          for (let requiredField of requiredFields) {
            if (xor(!hasValue(control.value[requiredField]), invert)) {
              requiringFieldErrors[requiredField] = { 'required': true };
            }
          }

          // Validate schema dependencies
          requiringFieldErrors = _mergeObjects(requiringFieldErrors,
            forEachCopy(properties, (requirements, requiredField) => {
              let requiredFieldErrors: PlainObject = _mergeObjects(
                forEachCopy(requirements, (requirement, parameter) => {
                  let validator: IValidatorFn = null;
                  if (requirement === 'maximum' || requirement === 'minimum') {
                    let exclusive: boolean =
                      !!requirements['exclusiveM' + requirement.slice(1)];
                    validator = JsonValidators[requirement](parameter, exclusive);
                  } else if (typeof JsonValidators[requirement] === 'function') {
                    validator = JsonValidators[requirement](parameter);
                  }
                  return !isDefined(validator) ?
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
      if (isEmpty(control.value)) { return null; }
      let actualItems: number = isArray(control.value) ? control.value.length : 0;
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
      let actualItems: number = isArray(control.value) ? control.value.length : 0;
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
      if (!unique) { return null; }
      if (isEmpty(control.value)) { return null; }
      let sorted: any[] = control.value.slice().sort();
      let duplicateItems = [];
      for (let i = 1, l = sorted.length; i < l; i++) {
        if (sorted[i - 1] === sorted[i] &&
          duplicateItems.indexOf(sorted[i]) !== -1
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
   *           composeAllOfAsync, composeNotAsync
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
    if (!validators) { return null; }
    let presentValidators: IValidatorFn[] = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      let arrayOfErrors: PlainObject[] =
        _executeValidators(control, presentValidators, invert).filter(isDefined);
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
    if (!validators) { return null; }
    let presentValidators: IValidatorFn[] = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      let arrayOfErrors: PlainObject[] =
        _executeValidators(control, presentValidators);
      let validControls: number =
        validators.length - arrayOfErrors.filter(isDefined).length;
      let isValid: boolean = validControls === 1;
      if (xor(isValid, invert)) { return null; }
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
    if (!validators) { return null; }
    let presentValidators: IValidatorFn[] = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
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
   * @param {IValidatorFn[]} validators - validator(s) to invert
   * @return {IValidatorFn} - new validator function that returns opposite result
   */
  static composeNot(validator: IValidatorFn): IValidatorFn {
    return (control: AbstractControl, invert: boolean = false): PlainObject => {
      if (isEmpty(control.value)) { return null; }
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
    if (!validators) { return null; }
    let presentValidators = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
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
    if (!validators) { return null; }
    let presentValidators = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl, invert: boolean = false) => Promise.all(
      _executeAsyncValidators(control, presentValidators).map(_convertToPromise)
    ).then(_mergeErrors);
  }
}
