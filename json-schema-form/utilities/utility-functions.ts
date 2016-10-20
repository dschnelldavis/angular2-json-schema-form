import {
  AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn
} from '@angular/forms';

import * as _ from 'lodash';

import { JsonPointer } from './jsonpointer';
import { JsonValidators } from '../validators/json-validators';
import {
  isPresent, isBlank, isSet, isNotSet, isEmpty, isString, isNumber,
  isInteger, isBoolean, isFunction, isObject, isArray, getType, isType,
  toJavaScriptType, toSchemaType, xor, hasOwn, forOwn
} from '../validators/validator-functions';

export {
  isPresent, isBlank, isSet, isNotSet, isEmpty, isString, isNumber,
  isInteger, isBoolean, isFunction, isObject, isArray, getType, isType,
  toJavaScriptType, toSchemaType, xor, hasOwn, forOwn
}

/**
 * 'listInputOptions' function
 *
 * @param {string} inputType -
 * @return {string[]} -
 */
export function listInputOptions(inputType: string): string[] {
  let optionsToUpdate: string[] = [
    'title', 'notitle', 'disabled', 'description', 'validationMessage',
    'onChange', 'feedback', 'disableSuccessState', 'disableErrorState',
    'placeholder', 'ngModelOptions', 'readonly', 'copyValueTo', 'condition',
    'destroyStrategy', 'htmlClass', 'fieldHtmlClass', 'labelHtmlClass', 'enum'
  ];
  switch (inputType) {
    case 'text': case 'textarea': case 'search':
      return optionsToUpdate.concat(
        'minLength', 'maxLength', 'pattern', 'format');
    case 'email': case 'url':
      return optionsToUpdate.concat('format');
    case 'date': case 'datetime': case 'datetime-local':
      return optionsToUpdate.concat('minimum', 'maximum', 'format');
    case 'number': case 'integer': case 'range':
      return optionsToUpdate.concat('minimum', 'exclusiveMinimum',
        'maximum', 'exclusiveMaximum', 'multipleOf');
    case 'fieldset':
      return optionsToUpdate.concat(
        'minProperties', 'maxProperties', 'dependencies');
    case 'array': case 'checkboxes':
      return optionsToUpdate.concat('minItems', 'maxItems', 'uniqueItems');
    default:
      return optionsToUpdate;
  }
}

/**
 * 'getInputType' function
 *
 * @param {any} schema
 * @return {string}
 */
export function getInputType(schema: any): string {
  if (
    isObject(schema['x-schema-form']) && isSet(schema['x-schema-form']['type'])
  ) return schema['x-schema-form']['type'];
  let schemaType = schema.type;
  if (isArray(schemaType)) { // If multiple types OK, use most permissive
    if (schemaType.indexOf('string') !== -1) {
      schemaType = 'string';
    } else if (schemaType.indexOf('number') !== -1) {
      schemaType = 'number';
    } else if (schemaType.indexOf('integer') !== -1) {
      schemaType = 'integer';
    } else if (schemaType.indexOf('boolean') !== -1) {
      schemaType = 'boolean';
    } else if (schemaType.indexOf('object') !== -1) {
      schemaType = 'object';
    } else if (schemaType.indexOf('array') !== -1) {
      schemaType = 'array';
    } else {
      schemaType = 'null';
    }
  }
  if (schemaType === 'boolean') return 'checkbox';
  if (schemaType === 'object') {
    if (hasOwn(schema, 'properties')) return 'fieldset';
    return 'textarea';
  }
  if (schemaType === 'array') {
    if (hasOwn(schema, 'enum')) return 'checkboxes';
    return 'array';
  }
  if (schemaType === 'null') return 'hidden';
  if (hasOwn(schema, 'enum')) return 'select';
  if (schemaType === 'number' || schemaType === 'integer') {
    if (hasOwn(schema, 'maximum') && hasOwn(schema, 'minimum') &&
      (schemaType === 'integer' || hasOwn(schema, 'multipleOf'))) return 'range';
    return schemaType;
  }
  if (schemaType === 'string') {
    if (hasOwn(schema, 'format')) {
      if (schema.format === 'color') return 'color';
      if (schema.format === 'date') return 'date';
      if (schema.format === 'date-time') return 'datetime-local';
      if (schema.format === 'email') return 'email';
      if (schema.format === 'uri') return 'url';
    }
    return 'text';
  }
  return 'text';
}

/**
 * 'getInputOptionValue' function
 *
 * @param {[type]} valueName
 * @param {[type]} layout
 * @param {[type]} schema
 * @return {[type]}
 */
export function getInputOptionValue(option: string, layout: any = {}, schema: any = {}): any {
  // Set any new validators from layout
  if (hasOwn(layout, option) && isFunction(JsonValidators[option]) && (
    !hasOwn(schema, option) || (schema[option] !== layout[option] &&
      !(option.slice(0, 3) === 'min' && schema[option] < layout[option]) &&
      !(option.slice(0, 3) === 'max' && schema[option] > layout[option])
    )
  )) {
     JsonPointer.set(
       this.jsonFormGroupTemplate,
       this.keyMap[layout.key]['templatePath'] + '/validators/' + option,
       [layout[option]]
     );
  }
  if (isSet(layout[option])) return layout[option];
  if (
    isObject(schema['x-schema-form']) && isSet(schema['x-schema-form'][option])
  ) return schema['x-schema-form'][option];
  if (isSet(schema[option])) return schema[option];
  if (option === 'notitle' || option === 'readonly') return false;
  return null;
}

/**
 * 'getFirstValue' function
 *
 * Searches an array and returns the first value that is not undefined or null
 *
 * @param {any[]} values - array of values to check
 * @return {any} - first set value
 */
export function getFirstValue(values: any[]): any {
  if (!isArray(values)) return null;
  for (let i = 0, l = values.length; i < l; i++) {
    if (isSet(values[i])) return values[i];
  }
  return null;
}

/**
 * 'mapLayout' function
 *
 * Creates a new layout by running each element in an existing layout through
 * an iteratee. Recursively maps within array elements 'items' and 'tabs'.
 * The iteratee is invoked with four arguments: (value, index, layout, path)
 *
 * THe returned layout may be longer (or shorter) then the source layout.
 *
 * If an item from the source layout returns multiple items (as '*' usually will),
 * this function will keep all returned items in-line with the surrounding items.
 *
 * If an item from the source layout causes an error and returns null, it is
 * simply skipped, and the function will still return all non-null items.
 *
 * @param {any[]} layout - the layout to map
 * @param {(v: any, i?: number, l?: any, p?: string) => any}
 *   function - the funciton to invoke on each element
 * @param {any[] = layout} rootLayout - the root layout, which conatins layout
 * @param {any = ''} path - the path to layout, inside rootLayout
 * @return {[type]}
 */
export function mapLayout(
  layout: any[],
  fn: (v: any, i?: number, l?: any, p?: string) => any,
  rootLayout: any[] = layout,
  path: string = ''
): any[] {
  let newLayout: any[] = [];
  let indexPad = 0;
  _.forEach(layout, (item, index) => {
    let realIndex = index + indexPad;
    let newPath = path + '/' + realIndex;
    let newItem: any = fn(item, realIndex, rootLayout, newPath);
    if (isObject(newItem)) {
      if (isArray(newItem.items)) {
        newItem.items =
          this.mapLayout(newItem.items, fn, rootLayout, newPath + '/items');
      } else if (isArray(newItem.tabs)) {
        newItem.tabs =
          this.mapLayout(newItem.tabs, fn, rootLayout, newPath + '/tabs');
      }
    }
    if (newItem === undefined) {
      indexPad--;
    } else {
      if (isArray(newItem)) indexPad += newItem.length - 1;
      newLayout = newLayout.concat(newItem);
    }
  });
  return newLayout;
};

/**
 * 'resolveSchemaReference' function
 *
 * @param {object | string} reference
 * @param {object} schema
 * @param {boolean = false} circularOK
 * @return {object}
 */
export function resolveSchemaReference(
  reference: any, schema: any, schemaReferences: any, circularOK: boolean = false
): any {
  let schemaPointer: string;
  if (typeof reference === 'string') {
    schemaPointer = JsonPointer.compile(reference);
  } else {
    if (!isObject(reference) || Object.keys(reference).length !== 1 ||
      !('$ref' in reference) || typeof reference.$ref !== 'string'
    ) {
      return reference;
    }
    schemaPointer = JsonPointer.compile(reference.$ref);
  }
  if (hasOwn(schemaReferences, schemaPointer)) {
    if (schemaReferences[schemaPointer].isCircular === true && !circularOK) {
      return { '$ref': schemaPointer };
    } else {
      return schemaReferences[schemaPointer].schema;
    }
  }
  if (schemaPointer === '' || schemaPointer === '/') {
    schemaReferences[''] = { 'isCircular': true }; // 'schema': schema,
    return circularOK ? schema : { '$ref': '' };
  } else if (schemaPointer.slice(0, 4) === 'http') {
    // Download remote schema
     this.http.get(schemaPointer).subscribe(response => {
      // TODO: check for circular references
      // TODO: test and adjust to allow for for async response
      schemaReferences[schemaPointer] = { 'schema': response.json() };
      return schemaReferences[schemaPointer];
     });
  } else {
    let item = JsonPointer.get(schema, schemaPointer);
    if (!isObject(item) || Object.keys(item).length !== 1 ||
      !('allOf' in item) || !isArray(item.allOf)) {
      schemaReferences[schemaPointer] = { 'schema': item };
      return item;
    } else {
      let targetSchema = item.allOf
        .map(object => this.resolveSchemaReference(object, schema, schemaReferences, circularOK))
        .reduce(Object.assign, {});
      // TODO: check for circular references
      schemaReferences[schemaPointer] = { 'schema': targetSchema };
      return targetSchema;
    }
  }
}

/**
 * 'getControlType' function
 *
 * @param {schema} schema
 * @return {'FormGroup'|'FormArray'|'FormControl'}
 */
export function getControlType(schema: any): 'FormGroup'|'FormArray'|'FormControl' {
  if (!hasOwn(schema, 'type')) return null;
  switch (schema.type) {
    case 'object':
      return (hasOwn(schema, 'properties')) ? 'FormGroup' : null;
    case 'array':
      return (hasOwn(schema, 'items')) ? 'FormArray' : null;
    case 'boolean': case 'string': case 'integer': case 'number':
      return 'FormControl';
    default:
      return null;
  }
}

/**
 * 'setObjectInputOptions' function
 *
 * @param {schema} schema - JSON Schema
 * @param {object} formControlTemplate - Form Control Template object
 * @return {boolean} true if any fields have been set to required, otherwise false
 */
export function setObjectInputOptions(schema: any, formControlTemplate: any): boolean {
  let fieldsRequired = false;
  if (hasOwn(schema, 'required') && !_.isEmpty(schema.required)) {
    fieldsRequired = true;
    let requiredArray = isArray(schema.required) ?
      schema.required : [schema.required];
    _.forEach(requiredArray,
      key => JsonPointer.set(formControlTemplate, '/' + key + '/validators/required', [])
    );
  }
  return fieldsRequired;
  // TODO: Add support for patternProperties
  // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#pattern-properties
}

/**
 * 'getControlValidators' function
 *
 * @param {schema} schema
 * @return {validators}
 */
export function getControlValidators(schema: any) {
  let validators: any = {};
  if (hasOwn(schema, 'type')) {
    switch (schema.type) {
      case 'string':
        _.forEach(['pattern', 'format', 'minLength', 'maxLength'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'number': case 'integer':
        _.forEach(['Minimum', 'Maximum'], (Limit) => {
          let limit = Limit.toLowerCase();
          let eLimit = 'exclusive' + Limit;
          if (hasOwn(schema, limit)) {
            let exclusive = hasOwn(schema, eLimit) && schema[eLimit] === true;
            validators[limit] = [schema[limit], exclusive];
          }
        });
        if (hasOwn(schema, 'multipleOf')) {
          validators['multipleOf'] = [schema.multipleOf];
        }
      break;
      case 'object':
        _.forEach(['minProperties', 'maxProperties', 'dependencies'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'array':
        _.forEach(['minItems', 'maxItems', 'uniqueItems'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
    }
  }
  if (hasOwn(schema, 'enum')) validators['enum'] = [schema.enum];
  return validators;
}

/**
 * 'forOwnDeep' function
 *
 * Iterates over own enumerable properties of an object or items in an array
 * and invokes an iteratee function for each key/value or index/value pair.
 *
 * Similar to the Lodash _.forOwn and _.forEach functions, except:
 *
 * - This function also iterates over sub-objects and arrays
 * (using _.forOwn and _.forEach), after calling the iteratee function on the
 * containing object or array itself (except for the root object or array).
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
 * - A fifth optional boolean parameter of TRUE may be added to reverse direction,
 * which causes the iterator function to be called on sub-objects and arrays
 * (using _.forOwnRight and _.forEachRight) before being called on the
 * containing object or array itself (still excluding the root object or array).
 *
 * @param {object} object - the initial object or array
 * @param {(v: any, k?: string, o?: any, p?: any) => any} function - iteratee function
 * @param {object = object} rootObject - optional, root object or array
 * @param {string = ''} jsonPointer - optional, JSON Pointer to object within rootObject
 * @param {boolean = false} bottomUp - optional, set to TRUE to reverse direction
 * @return {object} - the object or array
 */
export function forOwnDeep(
  object: any,
  fn: (value: any, key?: string, object?: any, jsonPointer?: string) => any,
  rootObject: any = null,
  jsonPointer: string = '',
  bottomUp: boolean = false
): any {
  let isRoot: boolean = !rootObject;
  if (isRoot) { rootObject = object; }
  let currentKey = JsonPointer.parse(jsonPointer).pop();
  let forFn = null;
  if (!isRoot && !bottomUp) fn(object, currentKey, rootObject, jsonPointer);
  if (isArray(object)) {
    forFn = bottomUp ? _.forEachRight : _.forEach;
  } else if (isObject(object)) {
    forFn = bottomUp ? _.forOwnRight : _.forOwn;
  }
  if (typeof forFn === 'function') {
    forFn(object, (value, key) => this.forOwnDeep(
      value, fn, rootObject, jsonPointer + '/' + JsonPointer.escape(key), bottomUp
    ));
  }
  // *** non-lodash implementation ***
  // if (isArray(object) || isObject(object)) {
  //   let keys = Object.keys(object);
  //   if (bottomUp) {
  //     for (let i = keys.length - 1, l = 0; i >= l; i--) {
  //       this.forOwnDeep(object[keys[i]], fn, rootObject, jsonPointer + '/' + JsonPointer.escape(keys[i]), bottomUp);
  //     }
  //   } else {
  //     for (let i = 0, l = keys.length; i < l; i++) {
  //       this.forOwnDeep(object[keys[i]], fn, rootObject, jsonPointer + '/' + JsonPointer.escape(keys[i]), bottomUp);
  //     }
  //   }
  // }
  if (!isRoot && bottomUp) fn(object, currentKey, rootObject, jsonPointer);
  return object;
}

/**
 * 'isInputRequired' function
 *
 * Checks a JSON Schema to see if an item is required
 *
 * @param {schema} schema - the schema to check
 * @param {string} key - the key of the item to check
 * @return {boolean} - true if the item is required, false if not
 */
export function isInputRequired(schema: any, pointer: string): boolean {
  if (!isObject(schema)) {
    console.error('Schema must be an object.');
    return false;
  }
  let dataPointerArray: string[] = JsonPointer.parse(pointer);
  if (isArray(dataPointerArray) && dataPointerArray.length) {
    let keyName: string = dataPointerArray[dataPointerArray.length - 1];
    let requiredList: any;
    if (dataPointerArray.length > 1) {
      let listPointerArray: string[] = dataPointerArray.slice(0, -1);
      if (listPointerArray[listPointerArray.length - 1] === '-') {
        listPointerArray = listPointerArray.slice(0, -1);
        requiredList = JsonPointer.getSchema(schema, listPointerArray)['items']['required'];
      } else {
        requiredList = JsonPointer.getSchema(schema, listPointerArray)['required'];
      }
    } else {
      requiredList = schema['required'];
    }
    if (isArray(requiredList)) return requiredList.indexOf(keyName) !== -1;
  }
  return false;
};

// export function hasOwn(item: any, property: string): boolean {
//   if (!isObject(item)) return false;
//   return Object.prototype.hasOwnProperty.call(item, property);
// }
//
// export function isEmpty(item: any): boolean {
//   if (!item ) return true;
//   if (isArray(item) && item.length === 0) return true;
//   if (isObject(item) && Object.keys(item).length === 0) return true;
//   return false;
// }
//
// export function isSet(item: any): boolean {
//   return item !== undefined && item !== null;
// }
//
// export function isObject(item: any): boolean {
//   return item !== null && typeof item === 'object' &&
//     Object.prototype.toString.call(item) === '[object Object]';
// }
//
// export function isArray(item: any): boolean {
//   return Array.isArray(item) ||
//     Object.prototype.toString.call(item) === '[object Array]';
// }
//
// export function isBoolean(item: any): boolean {
//   return typeof item === 'boolean' ||
//     Object.prototype.toString.call(item) === '[object Boolean]';
// }
//
// export function isFunction(item: any): boolean {
//   return typeof item === 'function';
// }
//
// export function isString(item: any): boolean {
//   return typeof item === 'string';
// }
