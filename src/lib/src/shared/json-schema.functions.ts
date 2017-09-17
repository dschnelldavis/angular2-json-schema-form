import * as _ from 'lodash';

import {
  getType, hasValue, inArray, isString, isFunction, isObject, isArray
} from './validator.functions';
import { forEach, hasOwn, mergeFilteredObject } from './utility.functions';
import { JsonPointer, Pointer } from './jsonpointer.functions';
import { JsonValidators } from './json.validators';

/**
 * JSON Schema function library:
 *
 * buildSchemaFromLayout:   TODO: Write this function
 *
 * buildSchemaFromData:
 *
 * getFromSchema:
 *
 * cloneSchemaPointer
 *
 * getSchemaReference:
 *
 * getInputType:
 *
 * checkInlineType:
 *
 * isInputRequired:
 *
 * updateInputOptions:
 *
 * getControlValidators:
 */

/**
 * 'buildSchemaFromLayout' function
 *
 * TODO: Build a JSON Schema from a JSON Form layout
 *
 * @param {any[]} layout - The JSON Form layout
 * @return {JSON Schema} - The new JSON Schema
 */
export function buildSchemaFromLayout(layout: any[]): any {
  return;
  // let newSchema: any = { };
  // const walkLayout = (layoutItems: any[], callback: Function): any[] => {
  //   let returnArray: any[] = [];
  //   for (let layoutItem of layoutItems) {
  //     const returnItem: any = callback(layoutItem);
  //     if (returnItem) { returnArray = returnArray.concat(callback(layoutItem)); }
  //     if (layoutItem.items) {
  //       returnArray = returnArray.concat(walkLayout(layoutItem.items, callback));
  //     }
  //   }
  //   return returnArray;
  // };
  // walkLayout(layout, layoutItem => {
  //   let itemKey: string;
  //   if (typeof layoutItem === 'string') {
  //     itemKey = layoutItem;
  //   } else if (layoutItem.key) {
  //     itemKey = layoutItem.key;
  //   }
  //   if (!itemKey) { return; }
  //   //
  // });
}

/**
 * 'buildSchemaFromData' function
 *
 * Build a JSON Schema from a data object
 *
 * @param {any} data - The data object
 * @return {JSON Schema} - The new JSON Schema
 */
export function buildSchemaFromData(
  data: any, requireAllFields = false, isRoot = true
): any {
  let newSchema: any = {};
  const getFieldType = (value: any): string => {
    let fieldType = getType(value, 'strict');
    if (fieldType === 'integer') { return 'number'; }
    if (fieldType === 'null') { return 'string'; }
    return fieldType;
  };
  const buildSubSchema = (value) =>
    buildSchemaFromData(value, requireAllFields, false);
  if (isRoot) { newSchema.$schema = 'http://json-schema.org/draft-06/schema#'; }
  newSchema.type = getFieldType(data);
  if (newSchema.type === 'object') {
    newSchema.properties = {};
    if (requireAllFields) { newSchema.required = []; }
    for (let key of Object.keys(data)) {
      newSchema.properties[key] = buildSubSchema(data[key]);
      if (requireAllFields) { newSchema.required.push(key); }
    }
  } else if (newSchema.type === 'array') {
    newSchema.items = data.map(buildSubSchema);
    // If all items are the same type, use an object for items instead of an array
    if ((new Set(data.map(getFieldType))).size === 1) {
      newSchema.items = newSchema.items.reduce((a, b) => ({ ...a, ...b }), {});
    }
    if (requireAllFields) { newSchema.minItems = 1; }
  }
  return newSchema;
}

/**
 * 'getFromSchema' function
 *
 * Uses a JSON Pointer for a data object to retrieve a sub-schema from
 * a JSON Schema which describes that data object
 *
 * @param {JSON Schema} schema - The schema to get the sub-schema from
 * @param {Pointer} dataPointer - JSON Pointer (string or array)
 * @param {boolean = false} returnContainer - Return containing object instead?
 * @return {schema} - The located sub-schema
 */
export function getFromSchema(
  schema: any, dataPointer: Pointer, returnContainer: boolean = false
): any {
  const dataPointerArray: any[] = JsonPointer.parse(dataPointer);
  let subSchema = schema;
  if (dataPointerArray === null) {
    console.error(`getFromSchema error: Invalid JSON Pointer: ${dataPointer}`);
    return null;
  }
  const l = returnContainer ? dataPointerArray.length - 1 : dataPointerArray.length;
  for (let i = 0; i < l; ++i) {
    const parentSchema = subSchema;
    const key = dataPointerArray[i];
    let subSchemaArray = false;
    let subSchemaObject = false;
    if (typeof subSchema !== 'object') {
      console.error(`getFromSchema error: Unable to find "${key}" key in schema.`);
      console.error(schema);
      console.error(dataPointer);
      return null;
    }
    if (subSchema['type'] === 'array' && hasOwn(subSchema, 'items') &&
      (!isNaN(key) || key === '-')
    ) {
      subSchema = subSchema['items'];
      subSchemaArray = true;
    }
    if (subSchema['type'] === 'object' && hasOwn(subSchema, 'properties')) {
      subSchema = subSchema['properties'];
      subSchemaObject = true;
    }
    if (!subSchemaArray || !subSchemaObject) {
      if (subSchemaArray && key === '-') {
        subSchema = hasOwn(parentSchema, 'additionalItems') ?
          parentSchema.additionalItems : { };
      } else if (typeof subSchema === 'object' && hasOwn(subSchema, key)) {
        subSchema = subSchema[key];
      } else {
        console.error(`getFromSchema error: Unable to find "${key}" item in schema.`);
        console.error(schema);
        console.error(dataPointer);
        return;
      }
    }
  }
  return subSchema;
}

/**
 * Keep the root reference to handle circular references correctly
 * when calling cloneSchemaReference
 */
let rootReference = null;

/**
 * 'cloneSchemaReference' function
 *
 * Deeply clone the sub-section of a schema referred to
 * by a JSON Pointer, compiling all child $ref nodes schemas.
 *
 * @param {string} schemaPointer  - The json pointer to clone
 * @param {object} schema - The schema to return a sub-section from
 * @param {string|object} reference - JSON Pointer or '$ref' object
 * @param {object} schemaRefLibrary - Optional library of resolved refernces
 * @param {object} recursiveRefMap - Optional map of recursive links
 * @return {object} - The cloned and arranged schema sub-section
 */
export function cloneSchemaReference(
  schemaPointer: string, schema: any, reference: any,
  schemaRefLibrary: any, recursiveRefMap: Map<string, string>
) {
  let isRoot = !rootReference;
  if (isRoot) { rootReference = '#' + reference; }
  let newSchema = _.cloneDeepWith(JsonPointer.get(schema, schemaPointer), (node: any) => {
    let nodeSchema: any;
    if (isObject(node)) {

      // If newSchema is an allOf array, combine the array elements
      // TODO: Check and fix duplicate elements with different values
      if (Object.keys(node).length === 1 && isArray((node || {}).allOf)) {
        nodeSchema = node.allOf
          .map(obj => !hasOwn(obj, '$ref') ? obj :
            getSchemaReference(schema, obj, schemaRefLibrary, recursiveRefMap)
          )
          .reduce((schema1, schema2) => ({ ...schema1, ...schema2 }), {});
        node.allOf = null;

      // If it's a reference to the root, clone the schema without customization
      // It's a reference to somethign else, compile the reference
      } else if (hasOwn(node, '$ref') ) {
        nodeSchema = node.$ref === rootReference ? _.cloneDeep(node.$ref) :
          getSchemaReference(schema, node.$ref, schemaRefLibrary, recursiveRefMap);

      // If it's an array of roots, clone it without customization
      } else if ((node || {}).type === 'array' &&
        ((node || {}).items || {}).$ref === rootReference
      ) {
        nodeSchema = _.cloneDeep(node);
      }
      return nodeSchema;
    }
  });
  if (isRoot) { rootReference = null; }
  if (schemaRefLibrary) {
    schemaRefLibrary[schemaPointer] = _.cloneDeep(newSchema);
  }
  return newSchema;
}

/**
 * 'getSchemaReference' function
 *
 * Return the sub-section of a schema referred to
 * by a JSON Pointer or '$ref' object.
 *
 * @param {object} schema - The schema to return a sub-section from
 * @param {string|object} reference - JSON Pointer or '$ref' object
 * @param {object} schemaRefLibrary - Optional library of resolved refernces
 * @param {object} recursiveRefMap - Optional map of recursive links
 * @return {object} - The refernced schema sub-section
 */
export function getSchemaReference(
  schema: any, reference: any, schemaRefLibrary: any = null,
  recursiveRefMap: Map<string, string> = null
): any {
  let schemaPointer: string;
  let newSchema: any;
  if (isArray(reference) || typeof reference === 'string') {
    schemaPointer = JsonPointer.compile(reference);
  } else if (isObject(reference) && Object.keys(reference).length === 1 &&
    hasOwn(reference, '$ref') && typeof reference.$ref === 'string'
  ) {
    schemaPointer = JsonPointer.compile(reference.$ref);
  } else {
    console.error('getSchemaReference error: ' +
      'reference must be a JSON Pointer or $ref link');
    console.error(reference);
    return reference;
  }
  if (recursiveRefMap) {
    schemaPointer = resolveRecursiveReferences(schemaPointer, recursiveRefMap);
  }

  return schemaPointer === '' ? _.cloneDeep(schema) :
    hasOwn(schemaRefLibrary, schemaPointer) ?
      _.cloneDeep(schemaRefLibrary[schemaPointer]) :
      cloneSchemaReference(
        schemaPointer, schema, reference, schemaRefLibrary, recursiveRefMap
      );
  // TODO: Add ability to download remote schema, if necessary
  // schemaPointer.slice(0, 4) === 'http' ?
  //   http.get(schemaPointer).subscribe(response => {
  //     // TODO: check for recursive references
  //     // TODO: test and adjust to allow for for async response
  //     if (schemaRefLibrary) schemaRefLibrary[schemaPointer] = response.json();
  //     return response.json();
  //   })
}

/**
 * 'resolveRecursiveReferences' function
 *
 * Checks a JSON Pointer against a map of recursive references and returns
 * a JSON Pointer to the shallowest equivalent location in the same object.
 *
 * Using this functions enables an object to be constructed with unlimited
 * recursion, while maintaing a fixed set of metadata, such as field data types.
 * The object can grow as large as it wants, and deeply recursed nodes can
 * just refer to the metadata for their shallow equivalents, instead of having
 * to add additional redundant metadata for each recursively added node.
 *
 * Example:
 *
 * pointer:         '/stuff/and/more/and/more/and/more/and/more/stuff'
 * recursiveRefMap: [['/stuff/and/more/and/more', '/stuff/and/more/']]
 * returned:        '/stuff/and/more/stuff'
 *
 * @param  {Pointer} pointer -
 * @param  {Map<string, string>} recursiveRefMap -
 * @param  {Map<string, number>} arrayMap - optional
 * @return {string} -
 */
export function resolveRecursiveReferences(
  pointer: Pointer, recursiveRefMap: Map<string, string>,
  arrayMap: Map<string, number> = new Map<string, number>()
): string {
  let genericPointer =
    JsonPointer.toGenericPointer(JsonPointer.compile(pointer), arrayMap);
  let possibleReferences = true;
  let previousPointerValues: Pointer[] = [];
  const catchCircularLinks = (newPointer) => {
    if (previousPointerValues.indexOf(newPointer) !== -1) {
      console.error('resolveRecursiveReferences error: ' +
        'recursive reference map contains circular links');
      console.error(recursiveRefMap);
      return;
    }
    previousPointerValues.push(genericPointer);
    return newPointer;
  };
  while (possibleReferences) {
    possibleReferences = false;
    recursiveRefMap.forEach((toPointer, fromPointer) => {
      if (JsonPointer.isSubPointer(toPointer, fromPointer)) {
        while (JsonPointer.isSubPointer(fromPointer, genericPointer)) {
          genericPointer = catchCircularLinks(JsonPointer.toGenericPointer(
            toPointer + genericPointer.slice(fromPointer.length), arrayMap
          ));
          possibleReferences = true;
        }
      }
    });
  }
  return genericPointer;
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
  if (isString(controlType)) { return checkInlineType(controlType, schema, layoutNode); }
  let schemaType = schema.type;
  if (schemaType) {
    if (isArray(schemaType)) { // If multiple types listed, use most inclusive type
      schemaType =
        inArray('object', schemaType) && hasOwn(schema, 'properties') ? 'object' :
        inArray('array', schemaType) && hasOwn(schema, 'items') ? 'array' :
        inArray('string', schemaType) ? 'string' :
        inArray('number', schemaType) ? 'number' :
        inArray('integer', schemaType) ? 'integer' :
        inArray('boolean', schemaType) ? 'boolean' : 'null';
    }
    if (schemaType === 'boolean') { return 'checkbox'; }
    if (schemaType === 'object') {
      return hasOwn(schema, 'properties') ? 'section' :
        hasOwn(schema, '$ref') ? '$ref' :
        JsonPointer.has(schema, '/additionalProperties/$ref') ? '$ref' : null;
    }
    if (schemaType === 'array') {
      let itemsObject: any = JsonPointer.getFirst([
        [schema, '/items'],
        [schema, '/additionalItems']
      ]) || {};
      return hasOwn(itemsObject, 'enum') && schema.maxItems !== 1 ?
        checkInlineType('checkboxes', schema, layoutNode) : 'array';
    }
    if (schemaType === 'null') { return 'hidden'; }
    if (hasOwn(schema, 'enum')) { return 'select'; }
    if (schemaType === 'number' || schemaType === 'integer') {
      return (schemaType === 'integer' || hasOwn(schema, 'multipleOf')) &&
        hasOwn(schema, 'maximum') && hasOwn(schema, 'minimum') ? 'range' : schemaType;
    }
    if (schemaType === 'string') {
      return {
        'color': 'color',
        'date': 'date',
        'date-time': 'datetime-local',
        'email': 'email',
        'uri': 'url',
      }[schema.format] || 'text';
    }
  }
  return hasOwn(schema, '$ref') ? '$ref' : 'text';
}

/**
 * 'checkInlineType' function
 *
 * Checks layout and schema nodes for 'inline: true', and converts
 * 'radios' or 'checkboxes' to 'radios-inline' or 'checkboxes-inline'
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
      [schema, '/widget/inline'],
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
    const requiredList = listPointerArray.length ? JsonPointer.get(schema,
      listPointerArray[listPointerArray.length - 1] === '-' ?
        [...listPointerArray.slice(-1), 'items', 'required'] :
        [...listPointerArray, 'required']
    ) : schema.required;
    if (isArray(requiredList)) { return requiredList.includes(keyName); }
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
export function updateInputOptions(layoutNode: any, schema: any, jsf: any) {
  if (!isObject(layoutNode)) { return; }
  const templatePointer = JsonPointer.get(
    jsf, ['dataMap', layoutNode.dataPointer, 'templatePointer']
  );

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
      jsf.formGroupTemplate = JsonPointer.set(
        jsf.formGroupTemplate, validatorPointer, [layoutNode[option]]
      );
    }
  });

  // Set all option values in layoutNode.options
  let newOptions: any = { };
  const fixUiKeys =
    (key) => key.slice(0, 3).toLowerCase() === 'ui:' ? key.slice(3) : key;
  mergeFilteredObject(newOptions, jsf.globalOptions.formDefaults, [], fixUiKeys);
  if (JsonPointer.has(schema, '/items/titleMap')) {
    newOptions.enum = schema.items.titleMap;
  } else if (JsonPointer.has(schema, '/items/enum')) {
    newOptions.enum = schema.items.enum;
  }
  mergeFilteredObject(newOptions, JsonPointer.get(schema, '/ui:widget/options'),
    [], fixUiKeys);
  mergeFilteredObject(newOptions, JsonPointer.get(schema, '/ui:widget'),
    [], fixUiKeys);
  mergeFilteredObject(newOptions, schema, ['properties', 'items', 'required',
    'type', 'x-schema-form', '$ref'], fixUiKeys);
  mergeFilteredObject(newOptions, JsonPointer.get(schema, '/x-schema-form/options'),
    [], fixUiKeys);
  mergeFilteredObject(newOptions, JsonPointer.get(schema, '/x-schema-form'),
    ['items', 'options'], fixUiKeys);
  mergeFilteredObject(newOptions, layoutNode, ['arrayItem', 'dataPointer',
    'dataType', 'items', 'layoutPointer', 'listItems', 'name', 'options',
    'tupleItems', 'type', 'widget', '_id', '$ref'], fixUiKeys);
  mergeFilteredObject(newOptions, layoutNode.options, [], fixUiKeys);
  layoutNode.options = newOptions;

  // If schema type is integer, enforce by setting multipleOf = 1
  if (schema.type === 'integer' && !hasValue(layoutNode.options.multipleOf)) {
    layoutNode.options.multipleOf = 1;
  }

  // Copy any typeahead word lists to options.typeahead.source
  if (JsonPointer.has(newOptions, '/autocomplete/source')) {
    newOptions.typeahead = newOptions.autocomplete;
  } else if (JsonPointer.has(newOptions, '/tagsinput/source')) {
    newOptions.typeahead = newOptions.tagsinput;
  } else if (JsonPointer.has(newOptions, '/tagsinput/typeahead/source')) {
    newOptions.typeahead = newOptions.tagsinput.typeahead;
  }

  // If field value is set in layoutNode, and no input data, update template value
  if (templatePointer && schema.type !== 'array' && schema.type !== 'object') {
    let layoutNodeValue: any = JsonPointer.getFirst([
      [ jsf.defaultValues, layoutNode.dataPointer ],
      [ layoutNode, '/value' ],
      [ layoutNode, '/default' ]
    ]);
    let templateValue: any = JsonPointer.get(
      jsf.formGroupTemplate, templatePointer + '/value/value'
    );
    if (hasValue(layoutNodeValue) && layoutNodeValue !== templateValue) {
      jsf.formGroupTemplate = JsonPointer.set(
        jsf.formGroupTemplate, templatePointer + '/value/value', layoutNodeValue
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
  if (!isObject(schema)) { return null; }
  let validators: any = { };
  if (hasOwn(schema, 'type')) {
    switch (schema.type) {
      case 'string':
        forEach(['pattern', 'format', 'minLength', 'maxLength'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
      case 'number': case 'integer':
        forEach(['Minimum', 'Maximum'], (ucLimit) => {
          let eLimit = 'exclusive' + ucLimit;
          let limit = ucLimit.toLowerCase();
          if (hasOwn(schema, limit)) {
            let exclusive = hasOwn(schema, eLimit) && schema[eLimit] === true;
            validators[limit] = [schema[limit], exclusive];
          }
        });
        forEach(['multipleOf', 'type'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
      case 'object':
        forEach(['minProperties', 'maxProperties', 'dependencies'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
      case 'array':
        forEach(['minItems', 'maxItems', 'uniqueItems'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
    }
  }
  if (hasOwn(schema, 'enum')) { validators.enum = [schema.enum]; }
  return validators;
}
