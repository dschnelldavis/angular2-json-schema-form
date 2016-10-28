import {
  AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { toPromise } from 'rxjs/operator/toPromise';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import {
  buildFormGroupTemplate, forOwnDeep, hasOwn, inArray, isPresent, isBlank,
  isSet, isEmpty, isString, isInteger, isFunction, isObject, isArray, getType,
  JsonPointer, JsonValidators, toJavaScriptType, toSchemaType, JavaScriptType,
  PlainObject, Pointer, SchemaPrimitiveType, SchemaType,
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
 * @param {JSON Schema} schema - schema to get value from
 * @param {Pointer} dataPointer - JSON Pointer (string or array)
 * @param {boolean = false} returnContainer - return containing object instead
 * @return {schema} - located value or object
 */
export function getFromSchema(
  schema: any, dataPointer: Pointer, returnContainer: boolean = false
): any {
  let subSchema = schema;
  let dataPointerArray: any[] = JsonPointer.parse(dataPointer);
  if (dataPointerArray === null) {
    console.error('Unable to get schema - invalid JSON Pointer: ' + dataPointer);
    return null;
  }
  let l = dataPointerArray.length;
  if (returnContainer) l--;
  for (let i = 0; i < l; ++i) {
    let parentSchema = subSchema;
    let key = dataPointerArray[i];
    let subSchemaArray = false;
    let subSchemaObject = false;
    if (typeof subSchema !== 'object') {
      console.error('Unable to find "' + key + '" key in schema.');
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
      } else if (typeof subSchema !== 'object' || !(subSchema.hasOwnProperty(key))) {
        console.error('Unable to find "' + key + '" item in schema.');
        console.error(schema);
        console.error(dataPointer);
        return null;
      }
      subSchema = subSchema[key];
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
    console.error('Schema must be an object.');
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
export function updateInputOptions(
  layout: any, schema: any, data: any, formDefaults: any,
  fieldMap: any, schemaRefLibrary: any, formGroupTemplate: any
) {
  let type: string[] = (isPresent(layout.type) && isArray(layout.type)) ?
    <string[]>layout.type : [<string>layout.type];
  let optionsToUpdate: string[] = [
    'title', 'notitle', 'disabled', 'description', 'validationMessage',
    'onChange', 'feedback', 'disableSuccessState', 'disableErrorState',
    'placeholder', 'ngModelOptions', 'readonly', 'copyValueTo', 'condition',
    'destroyStrategy', 'htmlClass', 'fieldHtmlClass', 'labelHtmlClass', 'enum',
    'enumNames', 'options', 'ui:rootFieldId', 'ui:help', 'ui:disabled',
    'ui:readonly', 'ui:placeholder', 'ui:autofocus', 'ui:options', 'classNames',
    'label', 'errors', 'help', 'hidden', 'required', 'displayLabel'
  ];
  if (inArray(['text', 'textarea', 'search'], type) || isBlank(type)) {
    optionsToUpdate = optionsToUpdate.concat('minLength', 'maxLength', 'pattern');
  }
  if (inArray(['text', 'textarea', 'search', 'email', 'url', 'date', 'datetime',
    'date-time', 'datetime-local'], type) || isBlank(type)) {
    optionsToUpdate = optionsToUpdate.concat('format');
  }
  if (inArray(['date', 'datetime', 'date-time', 'datetime-local',
    'number', 'integer', 'range'], type) || isBlank(type)) {
    optionsToUpdate = optionsToUpdate.concat('minimum', 'maximum');
  }
  if (inArray(['number', 'integer', 'range'], type) || isBlank(type)) {
    optionsToUpdate = optionsToUpdate
      .concat('exclusiveMinimum', 'exclusiveMaximum', 'multipleOf');
  }
  if (inArray('fieldset', type) || isBlank(type)) {
    optionsToUpdate = optionsToUpdate
      .concat('minProperties', 'maxProperties', 'dependencies');
  }
  if (inArray(['array', 'checkboxes'], type) || isBlank(type)) {
    optionsToUpdate = optionsToUpdate
      .concat('minItems', 'maxItems', 'uniqueItems');
  }
  _.forEach(optionsToUpdate, option => {

    // If a new validator is needed in template, set it
    if (hasOwn(layout, option) && isFunction(JsonValidators[option]) && (
      !hasOwn(schema, option) || (schema[option] !== layout[option] &&
        !(option.slice(0, 3) === 'min' && schema[option] < layout[option]) &&
        !(option.slice(0, 3) === 'max' && schema[option] > layout[option])
      )
    )) {
      let validatorPointer =
        fieldMap[layout.pointer]['templatePointer'] + '/validators/' + option;
      JsonPointer.set(formGroupTemplate, validatorPointer, [layout[option]]);
    }

    // Check for option value, and set in layout
    let newValue: any = JsonPointer.getFirst([
      [ layout, [option] ],
      [ schema['x-schema-form'], [option] ],
      [ schema, [option]],
      [ formDefaults, [option] ]
    ]);
    if (option === 'enum' && isBlank(newValue) &&
      schema.hasOwnProperty('items') && schema.items.hasOwnProperty('enum')
    ) {
      newValue = schema.items.enum;
    }
    if (isPresent(newValue)) {
      if (option.slice(0, 3) === 'ui:') {
        layout[option.slice(3)] = newValue;
      } else {
        layout[option] = newValue;
      }
    }
  });

  // For React Jsonschema Form compatibility
  if (JsonPointer.has(schema, '/ui:widget/options')) {
    _.forOwn(JsonPointer.get(schema, '/ui:widget/options'), (value, option) => {
      if (!hasOwn(layout, option)) layout[option] = value;
    });
  }

  let templatePointer = (fieldMap.hasOwnProperty(layout.pointer) &&
    fieldMap[layout.pointer].hasOwnProperty('templatePointer')) ?
    fieldMap[layout.pointer]['templatePointer'] : null;

  // If schema type is integer, enforce by setting multipleOf = 1
  if (inArray(schema.type, ['integer']) && !hasOwn(layout, 'multipleOf')) {
    layout.multipleOf = 1;

  // If schema type is array, save controlTemplate in layout
  } else if (templatePointer && schema.type === 'array') {
    if (JsonPointer.has(schema, '/items/$ref')) {
      layout.controlTemplate = buildFormGroupTemplate(
        getSchemaReference(schema, schema.items.$ref, schemaRefLibrary),
        schemaRefLibrary, fieldMap
      );
    } else {
      layout.controlTemplate = _.cloneDeep(
        JsonPointer.get(formGroupTemplate, templatePointer + '/controls/-')
      );
    }
    if (JsonPointer.has(layout, '/controlTemplate/value')) delete layout.controlTemplate.value;

  // If schema is an object with a $ref link, save controlTemplate in layout
  } else if (hasOwn(schema, '$ref')) {
    layout.controlTemplate = buildFormGroupTemplate(
      getSchemaReference(schema, schema.$ref, schemaRefLibrary),
      schemaRefLibrary, fieldMap
    );
  } else if (JsonPointer.has(schema, '/additionalProperties/$ref')) {
    layout.controlTemplate = buildFormGroupTemplate(
      getSchemaReference(schema, schema.additionalProperties.$ref, schemaRefLibrary),
      schemaRefLibrary, fieldMap
    );
  }

// console.log(layout.pointer);
// console.log(schemaRefLibrary[layout.pointer]);
// console.log(JsonPointer.get(formGroupTemplate, templatePointer + '/controls/-'));



  // If field value is set in layout, and no input data, update template value
  if (templatePointer && schema.type !== 'array' && schema.type !== 'object') {
    let layoutValue: any = JsonPointer.getFirst([
      [ data, layout.pointer ],
      [ layout, '/value' ],
      [ layout, '/default' ]
    ]);
    let templateValue: any = JsonPointer.get(formGroupTemplate, templatePointer + '/value');
    if (isSet(layoutValue) && layoutValue !== templateValue) {
      JsonPointer.set(formGroupTemplate, templatePointer + '/value', layoutValue);
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
          let eLimit = 'exclusive' + Limit;
          let limit = Limit.toLowerCase();
          if (hasOwn(schema, limit)) {
            let exclusive = hasOwn(schema, eLimit) && schema[eLimit] === true;
            validators[limit] = [schema[limit], exclusive];
          }
        });
        _.forEach(['multipleOf', 'type'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
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
  if (hasOwn(schema, 'enum')) validators['enum'] = [schema['enum']];
  return validators;
}
