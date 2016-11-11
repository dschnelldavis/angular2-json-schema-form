import {
  AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { toPromise } from 'rxjs/operator/toPromise';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';
import * as Immutable from 'immutable';

import {
  buildFormGroupTemplate, forEach, hasOwn, inArray, isDefined,
  hasValue, isString, isFunction, isObject, isArray, JsonPointer,
  JsonValidators, mergeFilteredObject, Pointer, SchemaType,
} from './index';

/**
 * JSON Schema function library:
 *
 * getFromSchema:
 *
 * getSchemaReference:
 *
 * getInputType:
 *
 * isInputRequired:
 *
 * updateInputOptions:
 *
 * getControlValidators:
 */

/**
 * 'getFromSchema' function
 *
 * Uses a JSON Pointer for a data object to retrieve a sub-schema from
 * a JSON Schema which describes that data object
 *
 * @param {JSON Schema} schema - Tchema to get value from
 * @param {Pointer} dataPointer - JSON Pointer (string or array)
 * @param {boolean = false} returnContainer - Return containing object instead?
 * @return {schema} - The located value or object
 */
export function getFromSchema(
  schema: any, dataPointer: Pointer, returnContainer: boolean = false
): any {
  const dataPointerArray: any[] = JsonPointer.parse(dataPointer);
  let subSchema = schema;
  if (dataPointerArray === null) {
    console.error('getFromSchema error: Invalid JSON Pointer: ' + dataPointer);
    return null;
  }
  const l = returnContainer ? dataPointerArray.length - 1 : dataPointerArray.length;
  for (let i = 0; i < l; ++i) {
    const parentSchema = subSchema;
    const key = dataPointerArray[i];
    let subSchemaArray = false;
    let subSchemaObject = false;
    if (typeof subSchema !== 'object') {
      console.error('getFromSchema error: Unable to find "' + key + '" key in schema.');
      console.error(schema);
      console.error(dataPointer);
      return null;
    }
    if (subSchema['type'] === 'array' && subSchema.hasOwnProperty('items') &&
      (!isNaN(key) || key === '-')
    ) {
      subSchema = subSchema['items'];
      subSchemaArray = true;
    }
    if (subSchema['type'] === 'object' && subSchema.hasOwnProperty('properties')) {
      subSchema = subSchema['properties'];
      subSchemaObject = true;
    }
    if (!subSchemaArray || !subSchemaObject) {
      if (subSchemaArray && key === '-') {
        subSchema = (parentSchema.hasOwnProperty('additionalItems')) ?
          parentSchema.additionalItems : {};
      } else if (typeof subSchema === 'object' && subSchema.hasOwnProperty(key)) {
        subSchema = subSchema[key];
      } else {
        console.error('getFromSchema error: Unable to find "' + key + '" item in schema.');
        console.error(schema);
        console.error(dataPointer);
        return;
      }
    }
  }
  return subSchema;
}

/**
 * 'getSchemaReference' function
 *
 * @param {object | string} reference - JSON Pointer, or '$ref' object
 * @param {object} schema - The schema containing the reference
 * @param {object} referenceLibrary - Optional library of resolved refernces
 * @return {object} - The refernced schema sub-section
 */
export function getSchemaReference(
  schema: any, reference: any, schemaRefLibrary: any = null
): any {
  let schemaPointer: string;
  let newSchema: any;
  if (typeof reference === 'string') {
    schemaPointer = JsonPointer.compile(reference);
  } else {
    if (!isObject(reference) || Object.keys(reference).length !== 1 ||
      !(reference.hasOwnProperty('$ref')) || typeof reference.$ref !== 'string'
    ) {
      return reference;
    }
    schemaPointer = JsonPointer.compile(reference.$ref);
  }
  if (schemaPointer === '') {
    return schema;
  } else if (schemaRefLibrary && schemaRefLibrary.hasOwnProperty(schemaPointer)) {
    return schemaRefLibrary[schemaPointer];

  // TODO: Add ability to download remote schema, if necessary
  // } else if (schemaPointer.slice(0, 4) === 'http') {
  //    http.get(schemaPointer).subscribe(response => {
  //     // TODO: check for circular references
  //     // TODO: test and adjust to allow for for async response
  //     if (schemaRefLibrary) schemaRefLibrary[schemaPointer] = response.json();
  //     return response.json();
  //    });

  } else {
    newSchema = JsonPointer.get(schema, schemaPointer);

    // If newSchema is just an allOf array, combine array elements
    // TODO: Check and fix duplicate elements with different values
    if (isObject(newSchema) && Object.keys(newSchema).length === 1 &&
      (newSchema.hasOwnProperty('allOf')) && isArray(newSchema.allOf)
    ) {
      newSchema = newSchema.allOf
        .map(object => getSchemaReference(schema, object, schemaRefLibrary))
        .reduce((schema1, schema2) => Object.assign(schema1, schema2), {});
    }
    if (schemaRefLibrary) schemaRefLibrary[schemaPointer] = newSchema;
    return newSchema;
  }
}

/**
 * 'getInputType' function
 *
 * @param {any} schema
 * @return {string}
 */
export function getInputType(schema: any, layoutNode: any = null): string {
  // x-schema-form = Angular Schema Form compatibility
  // widget & component = React Jsonschema Form compatibility
  let controlType = JsonPointer.getFirst([
    [schema, '/x-schema-form/type'],
    [schema, '/x-schema-form/widget/component'],
    [schema, '/x-schema-form/widget'],
    [schema, '/widget/component'],
    [schema, '/widget']
  ]);
  if (isString(controlType)) return checkInlineType(controlType, schema, layoutNode);
  let schemaType = schema.type;
  if (isArray(schemaType)) { // If multiple types listed, use most inclusive type
    if (inArray('object', schemaType) && hasOwn(schema, 'properties')) {
      schemaType = 'object';
    } else if (inArray('array', schemaType) && hasOwn(schema, 'items')) {
      schemaType = 'array';
    } else if (inArray('string', schemaType)) {
      schemaType = 'string';
    } else if (inArray('number', schemaType)) {
      schemaType = 'number';
    } else if (inArray('integer', schemaType)) {
      schemaType = 'integer';
    } else if (inArray('boolean', schemaType)) {
      schemaType = 'boolean';
    } else {
      schemaType = 'null';
    }
  }
  if (schemaType === 'boolean') return 'checkbox';
  if (schemaType === 'object') {
    if (hasOwn(schema, 'properties')) return 'fieldset';
    if (hasOwn(schema, '$ref') ||
      JsonPointer.has(schema, '/additionalProperties/$ref')) return '$ref';
    return null; // return 'textarea'; (?)
  }
  if (schemaType === 'array') {
    let itemsObject = JsonPointer.getFirst([
      [schema, '/items'],
      [schema, '/additionalItems']
    ]);
    if (!itemsObject) return null;
    if (hasOwn(itemsObject, 'enum')) {
      return checkInlineType('checkboxes', schema, layoutNode);
    } else {
      return 'array';
    }
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
  if (hasOwn(schema, '$ref')) return '$ref';
  return 'text';
}

/**
 * 'checkInlineType' function
 *
 * @param {string} controlType -
 * @param {JSON Schema} schema -
 * @return {string}
 */
export function checkInlineType(
  controlType: string, schema: any, layoutNode: any = null
): string {
  if (!isString(controlType) || (
    controlType.slice(0, 8) !== 'checkbox' && controlType.slice(0, 5) !== 'radio'
  )) {
    return controlType;
  }
  if (
    JsonPointer.getFirst([
      [layoutNode, '/inline'],
      [layoutNode, '/options/inline'],
      [schema, '/inline'],
      [schema, '/x-schema-form/inline'],
      [schema, '/x-schema-form/options/inline'],
      [schema, '/x-schema-form/widget/inline'],
      [schema, '/x-schema-form/widget/component/inline'],
      [schema, '/x-schema-form/widget/component/options/inline'],
      [schema, '/widget/inline']
      [schema, '/widget/component/inline'],
      [schema, '/widget/component/options/inline'],
    ]) === true
  ) {
    return controlType.slice(0, 5) === 'radio' ?
      'radios-inline' : 'checkboxes-inline';
  } else {
    return controlType;
  }
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
    console.error('isInputRequired error: Input schema must be an object.');
    return false;
  }
  let listPointerArray: string[] = JsonPointer.parse(pointer);
  if (isArray(listPointerArray) && listPointerArray.length) {
    let keyName: string = listPointerArray.pop();
    let requiredList: string[];
    if (listPointerArray.length) {
      if (listPointerArray[listPointerArray.length - 1] === '-') {
        requiredList = JsonPointer.get(schema,
          listPointerArray.slice(-1).concat(['items', 'required']));
      } else {
        requiredList = JsonPointer.get(schema, listPointerArray.concat('required'));
      }
    } else {
      requiredList = schema['required'];
    }
    if (isArray(requiredList)) return requiredList.indexOf(keyName) !== -1;
  }
  return false;
};

/**
 * 'updateInputOptions' function
 *
 * @param {any} layoutNode
 * @param {any} schema
 * @return {void}
 */
export function updateInputOptions(layoutNode: any, schema: any, formSettings: any) {
  if (!isObject(layoutNode)) return;
  const templatePointer = JsonPointer.get(formSettings,
    ['dataMap', layoutNode.dataPointer, 'templatePointer']);

  // If a validator is available for a layout option,
  // and not already set in the formGroup template, set it
  Object.keys(layoutNode).forEach(option => {
    if (option !== 'type' && isFunction(JsonValidators[option]) && (
      !hasOwn(schema, option) || ( schema[option] !== layoutNode[option] &&
        !(option.slice(0, 3) === 'min' && schema[option] < layoutNode[option]) &&
        !(option.slice(0, 3) === 'max' && schema[option] > layoutNode[option])
      )
    )) {
      const validatorPointer = templatePointer + '/validators/' + option;
      formSettings.formGroupTemplate = JsonPointer.set(
        formSettings.formGroupTemplate, validatorPointer, [layoutNode[option]]
      );
    }
  });

  // Set all option values in layoutNode.options
  let newOptions: any = {};
  const fixUiKeys = (key) => key.slice(0, 3) === 'ui:' ? key.slice(3) : key;
  mergeFilteredObject(newOptions, formSettings.globalOptions.formDefaults,
    [], false, fixUiKeys);
  if (JsonPointer.has(schema, '/items/enum')) newOptions.enum = schema.items.enum;
  if (JsonPointer.has(schema, '/items/titleMap')) newOptions.enum = schema.items.titleMap;
  mergeFilteredObject(newOptions, JsonPointer.get(schema, ['ui:widget', 'options']),
    [], false, fixUiKeys);
  // JsonPointer.remove(schema, ['ui:widget', 'options']);
  mergeFilteredObject(newOptions, JsonPointer.get(schema, ['ui:widget']),
    [], false, fixUiKeys);
  // JsonPointer.remove(schema, ['ui:widget']);
  mergeFilteredObject(newOptions, schema,
    ['properties', 'items', 'required', 'type', 'x-schema-form'], false, fixUiKeys);
  mergeFilteredObject(newOptions, JsonPointer.get(schema, ['x-schema-form', 'options']),
    [], false, fixUiKeys);
  mergeFilteredObject(newOptions, JsonPointer.get(schema, ['x-schema-form']),
    ['items', 'options'], false, fixUiKeys);
  // JsonPointer.remove(schema, ['x-schema-form']);
  mergeFilteredObject(newOptions, layoutNode, ['arrayItem', 'dataPointer',
    'dataType', 'items', 'layoutPointer', 'listItems', 'name', 'options',
    'tupleItems', 'type', 'widget'],
    false, fixUiKeys);
  mergeFilteredObject(newOptions, layoutNode.options, [], false, fixUiKeys);
  layoutNode.options = newOptions;

  // If schema type is integer, enforce by setting multipleOf = 1
  if (schema.type === 'integer' && !hasValue(layoutNode.options.multipleOf)) {
    layoutNode.options.multipleOf = 1;
  }

  // If field value is set in layoutNode, and no input data, update template value
  if (templatePointer && schema.type !== 'array' && schema.type !== 'object') {
    let layoutNodeValue: any = JsonPointer.getFirst([
      [ formSettings.defaultValues, layoutNode.dataPointer ],
      [ layoutNode, '/value' ],
      [ layoutNode, '/default' ]
    ]);
    let templateValue: any = JsonPointer.get(
      formSettings.formGroupTemplate, templatePointer + '/value/value'
    );
    if (hasValue(layoutNodeValue) && layoutNodeValue !== templateValue) {
      formSettings.formGroupTemplate = JsonPointer.set(
        formSettings.formGroupTemplate, templatePointer + '/value/value', layoutNodeValue
      );
    }
    delete layoutNode.value;
    delete layoutNode.default;
  }
}

/**
 * 'getControlValidators' function
 *
 * @param {schema} schema
 * @return {validators}
 */
export function getControlValidators(schema: any) {
  if (!isObject(schema)) return null;
  let validators: any = {};
  if (hasOwn(schema, 'type')) {
    switch (schema.type) {
      case 'string':
        forEach(['pattern', 'format', 'minLength', 'maxLength'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'number': case 'integer':
        forEach(['Minimum', 'Maximum'], (Limit) => {
          let eLimit = 'exclusive' + Limit;
          let limit = Limit.toLowerCase();
          if (hasOwn(schema, limit)) {
            let exclusive = hasOwn(schema, eLimit) && schema[eLimit] === true;
            validators[limit] = [schema[limit], exclusive];
          }
        });
        forEach(['multipleOf', 'type'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'object':
        forEach(['minProperties', 'maxProperties', 'dependencies'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'array':
        forEach(['minItems', 'maxItems', 'uniqueItems'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
    }
  }
  if (hasOwn(schema, 'enum')) validators['enum'] = [schema['enum']];
  return validators;
}
