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
  buildFormGroupTemplate, forEach, hasOwn, inArray, isPresent,
  isBlank, isSet, isString, isFunction, isObject, isArray,
  JsonPointer, JsonValidators, Pointer, SchemaType,
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
export function getInputType(schema: any): string {
  if (JsonPointer.has(schema, '/x-schema-form/type')) {// Angular Schema Form compatibility
    return schema['x-schema-form']['type'];
  }
  if (hasOwn(schema, 'ui:widget')) { // React Jsonschema Form compatibility
    if (isString(schema['ui:widget'])) return schema['ui:widget'];
    if (hasOwn(schema['ui:widget'], 'component')) {
      if (schema['ui:widget']['component'] === 'checkboxes' &&
        JsonPointer.get(schema, '/ui:widget/component/options/inline') === true
      ) {
        return 'checkboxes-inline';
      } else {
        return schema['ui:widget']['component'];
      }
    }
  }
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
    return null; // return 'textarea';
  }
  if (schemaType === 'array') {
    let itemsObject = JsonPointer.getFirst([
      [schema, '/items'],
      [schema, '/additionalItems']
    ]);
    if (!itemsObject) return null;
    if (hasOwn(itemsObject, 'enum')) return 'checkboxes';
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
  if (hasOwn(schema, '$ref')) return '$ref';
  return 'text';
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
 * @param {any} layout
 * @param {any} schema
 * @return {void}
 */
export function updateInputOptions(layout: any, schema: any, formOptions: any) {
  const templatePointer =
    JsonPointer.get(formOptions, ['dataMap', layout.pointer, 'templatePointer']);
  let optionsToUpdate: Set<any> = new Set();
  if (isObject(layout)) {
    Object.keys(layout).forEach(v => optionsToUpdate.add(v));
  }

  // If a validator is available and not set in the formGroup template, set it
  optionsToUpdate.forEach(option => {
    if (option !== 'type' && isFunction(JsonValidators[option]) && (
      !hasOwn(schema, option) || ( schema[option] !== layout[option] &&
      !(option.slice(0, 3) === 'min' && schema[option] < layout[option]) &&
      !(option.slice(0, 3) === 'max' && schema[option] > layout[option])
    ))) {
      const validatorPointer = templatePointer + '/validators/' + option;
      formOptions.formGroupTemplate = JsonPointer.set(
        formOptions.formGroupTemplate, validatorPointer, [layout[option]]
      );
    }
  });

  if (isObject(schema)) {
    Object.keys(schema).forEach(v => {
      if (!inArray(v, ['properties', 'items', 'required', 'x-schema-form'])) {
        optionsToUpdate.add(v);
      }
    });
    if (isObject(schema['x-schema-form'])) {
      Object.keys(schema['x-schema-form']).forEach(v => optionsToUpdate.add(v));
    }
  }
  if (isObject(formOptions.globalOptions.formDefaults)) {
    Object.keys(formOptions.globalOptions.formDefaults).forEach(v => optionsToUpdate.add(v));
  }

  // Check for option value, and set in layout
  optionsToUpdate.forEach(option => {
    let newValue: any = JsonPointer.getFirst([
      [ layout, [option] ],
      [ schema, ['x-schema-form', option] ],
      [ schema, [option] ],
      [ formOptions, ['globalOptions', 'formDefaults', option] ]
    ]);
    if (option === 'enum' && isBlank(newValue)) {
      newValue = JsonPointer.get(schema, '/items/enum');
    }
    if (isPresent(newValue)) {
      layout[option.slice(0, 3) === 'ui:' ? option.slice(3) : option] = newValue;
    }
  });

  // For React Jsonschema Form compatibility
  forEach(JsonPointer.get(schema, '/ui:widget/options'), (value, option) => {
    if (!hasOwn(layout, <string>option)) layout[option] = value;
  });

  // If schema type is integer, enforce by setting multipleOf = 1
  if (inArray(schema.type, ['integer']) && !hasOwn(layout, 'multipleOf')) {
    layout.multipleOf = 1;

  // If schema type is array, save controlTemplate in layout
  } else if (templatePointer && schema.type === 'array') {
    if (JsonPointer.has(schema, '/items/$ref')) {
      layout.controlTemplate = buildFormGroupTemplate(
        formOptions, schema.items.$ref
      );
    } else {
      layout.controlTemplate = _.cloneDeep(JsonPointer.get(
        formOptions.formGroupTemplate, templatePointer + '/controls/-'
      ));
    }
    JsonPointer.remove(layout, '/controlTemplate/value');

  // If schema is an object with a $ref link, save controlTemplate in layout
  } else if (hasOwn(schema, '$ref')) {
    layout.controlTemplate = buildFormGroupTemplate(
      formOptions, schema.$ref
    );
  } else if (JsonPointer.has(schema, '/additionalProperties/$ref')) {
    layout.controlTemplate = buildFormGroupTemplate(
      formOptions, schema.additionalProperties.$ref
    );
  }

  // If field value is set in layout, and no input data, update template value
  if (templatePointer && schema.type !== 'array' && schema.type !== 'object') {
    let layoutValue: any = JsonPointer.getFirst([
      [ formOptions.defaultValues, layout.pointer ],
      [ layout, '/value' ],
      [ layout, '/default' ]
    ]);
    let templateValue: any = JsonPointer.get(
      formOptions.formGroupTemplate, templatePointer + '/value'
    );
    if (isSet(layoutValue) && layoutValue !== templateValue) {
      formOptions.formGroupTemplate = JsonPointer.set(
        formOptions.formGroupTemplate, templatePointer + '/value', layoutValue
      );
    }
    if (isPresent(layout.value)) delete layout.value;
    if (isPresent(layout.default)) delete layout.default;
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
