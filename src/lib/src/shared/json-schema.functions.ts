import * as _ from 'lodash';
import * as $RefParser from 'json-schema-ref-parser';

import {
  getType, hasValue, inArray, isArray, isFunction, isNumber, isObject, isString
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
 * combineAllOf:
 *
 * cloneSchemaReference:
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
 *
 * resolveSchemaRefLinks:
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
    const fieldType = getType(value, 'strict');
    return { integer: 'number', null: 'string' }[fieldType] || fieldType;
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
 * Uses a JSON Pointer for a data object to retrieve a sub-schema
 * from a JSON Schema which describes that data object.
 *
 * The optional third parameter can also be set to return something else:
 * 'schema' (default): the schema for the value indicated by the data pointer
 * 'parentSchema': the schema for the value's parent object or array
 * 'pointer': a pointer to the value's schema
 * 'parentPointer': a pointer to the schema for the value's parent object or array
 *
 * @param {JSON Schema} schema - The schema to get the sub-schema from
 * @param {Pointer} dataPointer - JSON Pointer (string or array)
 * @param {boolean = false} returnContainer - Return containing object instead?
 * @return {schema} - The located sub-schema
 */
export function getFromSchema(
  schema: any, dataPointer: Pointer, returnType: string = 'schema'
): any {
  const dataPointerArray: any[] = JsonPointer.parse(dataPointer);
  if (dataPointerArray === null) {
    console.error(`getFromSchema error: Invalid JSON Pointer: ${dataPointer}`);
    return null;
  }
  let subSchema = schema;
  let schemaPointer = [];
  let l = dataPointerArray.length;
  if (returnType.slice(0, 6) === 'parent') { dataPointerArray.length--; }
  for (let i = 0; i < l; ++i) {
    const parentSchema = subSchema;
    const key = dataPointerArray[i];
    let subSchemaFound = false;
    if (typeof subSchema !== 'object') {
      console.error(`getFromSchema error: Unable to find "${key}" key in schema.`);
      console.error(schema);
      console.error(dataPointer);
      return null;
    }
    if (subSchema.type === 'array' && (!isNaN(key) || key === '-')) {
      if (hasOwn(subSchema, 'items')) {
        if (isObject(subSchema.items)) {
          subSchemaFound = true;
          subSchema = subSchema.items;
          schemaPointer.push('items');
        } else if (isArray(subSchema.items) &&
          !isNaN(key) && subSchema.items.length >= +key
        ) {
          subSchemaFound = true;
          subSchema = subSchema.items[+key];
          schemaPointer.push('items', key);
        }
      }
      if (!subSchemaFound && isObject(subSchema.additionalItems)) {
        subSchemaFound = true;
        subSchema = subSchema.additionalItems;
        schemaPointer.push('additionalItems');
      } else if (subSchema.additionalItems !== false) {
        subSchemaFound = true;
        subSchema = { };
        schemaPointer.push('additionalItems');
      }
    } else if (subSchema.type === 'object') {
      if (isObject(subSchema.properties) && hasOwn(subSchema.properties, key)) {
        subSchemaFound = true
        subSchema = subSchema.properties[key];
        schemaPointer.push('properties', key);
      } else if (isObject(subSchema.additionalProperties)) {
        subSchemaFound = true
        subSchema = subSchema.additionalProperties;
        schemaPointer.push('additionalProperties');
      } else if (subSchema.additionalProperties !== false) {
        subSchemaFound = true
        subSchema = { };
        schemaPointer.push('additionalProperties');
      }
    }
    if (!subSchemaFound) {
      console.error(`getFromSchema error: Unable to find "${key}" item in schema.`);
      console.error(schema);
      console.error(dataPointer);
      return;
    }
  }
  return returnType.slice(-5) === 'chema' ? subSchema : schemaPointer;
}

/**
 * 'combineAllOf' function
 *
 * Attempt to combine two schemas from an allOf array into a single schema
 * with the same rules.
 *
 * @param {any} schema1 -
 * @param {any} schema2 -
 * @return {any} -
 */
export function combineAllOf(schema1, schema2) {
  if (schema1 === undefined) { return _.cloneDeep(schema2); }
  const combinedSchema = _.cloneDeep(schema1);
  if (schema2 === undefined) { return combinedSchema; }
  // TODO: handle non-object inputs
  for (let key of Object.keys(schema2)) {
    let value1 = schema1[key];
    let value2 = schema2[key];
    if (!hasOwn(combinedSchema, key) || _.isEqual(value1, value2)) {
      combinedSchema[key] = value2;
    } else {
      let combined = true;
      switch (key) {
        case 'enum': case 'type': case 'anyOf': case 'oneOf':
        case 'additionalProperties':
          // If arrays, keep items common to both arrays
          if (isArray(value1) && isArray(value2)) {
            combinedSchema[key] = value1.filter(item1 =>
              value2.findIndex(item2 => _.isEqual(item1, item2)) > -1
            );
          // If objects, combine
          } else if (isObject(value1) && isObject(value2)) {
            combinedSchema[key] = combineAllOf(value1, value2);
          // If object + array, combine object with each array item
          } else if (isArray(value1) && isObject(value2)) {
            combinedSchema[key] = value1.map(item => combineAllOf(item, value2));
          } else if (isObject(value1) && isArray(value2)) {
            combinedSchema[key] = value2.map(item => combineAllOf(item, value1));
          } else {
            combined = false;
          }
        break;
        case 'allOf': case 'required':
          // If arrays, include all unique items from both arrays
          if (isArray(value1) && isArray(value2)) {
            combinedSchema[key] = [...value1, ...value2.filter(item2 =>
              value1.findIndex(item1 => _.isEqual(item2, item1)) === -1
            )];
          } else {
            combined = false;
          }
        break;
        case 'multipleOf':
          if (isNumber(value1) && isNumber(value2)) {
            const gcd = (x, y) => !y ? x : gcd(y, x % y);
            const lcm = (x, y) => (x * y) / gcd(x, y);
            combinedSchema[key] = lcm(value1, value2);
          } else {
            combined = false;
          }
        break;
        case 'maximum': case 'exclusiveMaximum': case 'maxLength':
        case 'maxItems': case 'maxProperties':
          combinedSchema[key] = Math.min(value1, value2);
        break;
        case 'minimum': case 'exclusiveMinimum': case 'minLength':
        case 'minItems': case 'minProperties':
          combinedSchema[key] = Math.max(value1, value2);
        break;
        case 'uniqueItems':
          combinedSchema[key] = !!value1 || !!value2;
        break;
        default:
          combined = false;
      }
      if (!combined) {
        return { 'allOf': [schema1, schema2] }
      }
    }
  }
  return combinedSchema;
};

/**
 * Keep the root reference to handle circular references correctly
 * when calling cloneSchemaReference
 */
let rootReference: string = null;

/**
 * 'cloneSchemaReference' function
 *
 * Deeply clone the sub-section of a schema referred to
 * by a JSON Pointer, compiling all child $ref nodes schemas.
 *
 * @param {object} schema - The schema to return a sub-section from
 * @param {string|object} reference - JSON Pointer or '$ref' object
 * @param {object} schemaRefLibrary - Optional library of resolved refernces
 * @param {object} recursiveRefMap - Optional map of recursive links
 * @return {object} - The cloned and arranged schema sub-section
 */
export function cloneSchemaReference(
  schema: any, reference: any, schemaRefLibrary: any = null,
  recursiveRefMap: Map<string, string> = null
) {
  let isRoot = !rootReference;
  if (isRoot) { rootReference = '#' + reference; }
  let newSchema = _.cloneDeepWith(JsonPointer.get(schema, reference), (node: any) => {
    let nodeSchema: any;
    if (isObject(node)) {

      // If newSchema is an allOf array, combine the array elements
      if (Object.keys(node).length === 1 && isArray((node || {}).allOf)) {
        nodeSchema = node.allOf
          .map(obj => !hasOwn(obj, '$ref') ? obj :
            getSchemaReference(schema, obj, schemaRefLibrary, recursiveRefMap)
          )
          .reduce((schema1, schema2) => combineAllOf(schema1, schema2), {});

      // If it's a reference to the root, clone the schema without customization
      // If it's a reference to something else, compile the reference
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
    schemaRefLibrary[reference] = _.cloneDeep(newSchema);
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
  if (schemaPointer === '') {
    return _.cloneDeep(schema);
  } else {
    if (!hasOwn(schemaRefLibrary, schemaPointer)) {
      schemaRefLibrary[schemaPointer] =
        cloneSchemaReference(schema, schemaPointer, schemaRefLibrary, recursiveRefMap);
    }
    return schemaRefLibrary[schemaPointer];
  }
  // TODO: Remove this function and use json-schema-ref-parser instead?
  // https://github.com/BigstickCarpet/json-schema-ref-parser/blob/master/docs/README.md
  // https://www.npmjs.com/package/json-schema-ref-parser
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
    if (hasOwn(schema, 'enum') ||
      hasOwn(layoutNode, 'titleMap') ||
      getTitleMapFromOneOf(schema, null, true)
    ) { return 'select'; }
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
 * @param {string} pointer - the pointer to the item to check
 * @return {boolean} - true if the item is required, false if not
 */
export function isInputRequired(schema: any, schemaPointer: string): boolean {
  if (!isObject(schema)) {
    console.error('isInputRequired error: Input schema must be an object.');
    return false;
  }
  const listPointerArray = JsonPointer.parse(schemaPointer);
  if (isArray(listPointerArray)) {
    if (!listPointerArray.length) { return schema.required === true; }
    const keyName = listPointerArray.pop();
    const nextToLastKey = listPointerArray[listPointerArray.length - 1];
    if (['properties', 'additionalProperties', 'items', 'additionalItems']
      .includes(nextToLastKey)
    ) {
      listPointerArray.pop();
    }
    const parentSchema = JsonPointer.get(schema, listPointerArray) || {};
    if (parentSchema.required) {
      return isArray(parentSchema.required) ?
        parentSchema.required.includes(keyName) :
        parentSchema.required === keyName;
    }
    if (parentSchema.type === 'array') {
      if (parentSchema.minItems && isNumber(keyName) &&
        +parentSchema.minItems >= +keyName
      ) {
        return true;
      }
      let required = null;
      if (isObject(parentSchema.items) && parentSchema.items.required) {
        required = parentSchema.items.required;
      } else if (isArray(parentSchema.items) &&
        (keyName === '' || keyName === '-') &&
        isObject(parentSchema.additionalItems) &&
        parentSchema.additionalItems.required
      ) {
        required = parentSchema.additionalItems.required;
      } else if (
        isArray(parentSchema.required) || isString(parentSchema.required)
      ) {
        // Note: Technically, this is not the correct place to list required
        // properties for an object inside an array, but it is a somewhat
        // common error, and the intent is clear, so we'll support it anyway.
        required = parentSchema.required;
      }
      if (required) {
        return isArray(required) ?
          required.includes(keyName) : required === keyName;
      }
    }
    // JSON Schema 3 style
    const itemSchema = JsonPointer.get(schema, schemaPointer) || {};
    if (itemSchema.required === true || itemSchema.required === false) {
      return itemSchema.required === true;
    }
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
  if (templatePointer) {
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
  }

  // Set all option values in layoutNode.options
  let newOptions: any = { };
  const fixUiKeys = key => key.slice(0, 3).toLowerCase() === 'ui:' ? key.slice(3) : key;
  mergeFilteredObject(newOptions, jsf.globalOptions.formDefaults, [], fixUiKeys);
  [ [ JsonPointer.get(schema, '/ui:widget/options'), [] ],
    [ JsonPointer.get(schema, '/ui:widget'), [] ],
    [ schema, ['properties', 'items', 'required', 'type', 'x-schema-form', '$ref'] ],
    [ JsonPointer.get(schema, '/x-schema-form/options'), [] ],
    [ JsonPointer.get(schema, '/x-schema-form'), ['items', 'options'] ],
    [ layoutNode, [
      '_id', 'arrayItem', 'dataPointer', 'dataType', 'items', 'layoutPointer',
      'listItems', 'name', 'options', 'tupleItems', 'type', 'widget', '$ref'
    ] ],
    [ layoutNode.options, [] ],
  ].forEach(([ object, excludeKeys ]) =>
    mergeFilteredObject(newOptions, object, excludeKeys, fixUiKeys)
  );
  if (!hasOwn(newOptions, 'titleMap')) {
    let newTitleMap: any = null;
    newTitleMap = getTitleMapFromOneOf(schema, newOptions.flatList);
    if (newTitleMap) { newOptions.titleMap = newTitleMap; }
    if (!hasOwn(newOptions, 'titleMap') && !hasOwn(newOptions, 'enum') && hasOwn(schema, 'items')) {
      if (JsonPointer.has(schema, '/items/titleMap')) {
        newOptions.titleMap = schema.items.titleMap;
      } else if (JsonPointer.has(schema, '/items/enum')) {
        newOptions.enum = schema.items.enum;
        if (!hasOwn(newOptions, 'enumNames') && JsonPointer.has(schema, '/items/enumNames')) {
          newOptions.enum = schema.items.enumNames;
        }
      } else if (JsonPointer.has(schema, '/items/oneOf')) {
        newTitleMap = getTitleMapFromOneOf(schema.items, newOptions.flatList);
        if (newTitleMap) { newOptions.titleMap = newTitleMap; }
      }
    }
  }
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
 * 'getTitleMapFromOneOf' function
 *
 * @param {schema} schema
 * @param {boolean} flatList
 * @param {boolean} validateOnly
 * @return {validators}
 */
export function getTitleMapFromOneOf(
  schema: any = {}, flatList: boolean = null, validateOnly: boolean = false
) {
  let titleMap = null;
  if (isArray(schema.oneOf) && schema.oneOf.every(item => item.title)) {
    if (schema.oneOf.every(item => isArray(item.enum) && item.enum.length === 1)) {
      if (validateOnly) { return true; }
      titleMap = schema.oneOf.map(item => ({ name: item.title, value: item.enum[0] }));
    } else if (schema.oneOf.every(item => item.const)) {
      if (validateOnly) { return true; }
      titleMap = schema.oneOf.map(item => ({ name: item.title, value: item.const }));
    }

    // if flatList !== false and some items have colons, make grouped map
    if (flatList !== false &&
      (titleMap || []).filter(title => ((title || {}).name || '').indexOf(': ')).length > 1
    ) {

      // Split name on first colon to create grouped map (name -> group: name)
      const newTitleMap = titleMap.map(title => {
        let [group, name] = title.name.split(/: (.+)/);
        return group && name ? { ...title, group, name } : title;
      });

      // If flatList === true or some groups have multiple items, use grouped map
      if (flatList === true || newTitleMap.some((title, index) => index &&
        hasOwn(title, 'group') && title.group === newTitleMap[index - 1].group
      )) {
        titleMap = newTitleMap;
      }
    }
  }
  return validateOnly ? false : titleMap;
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

/**
 * 'resolveSchemaRefLinks' function
 *
 * Resolve all schema $ref links
 *
 * @param {schema} schema
 * @return {validators}
 */
export function resolveSchemaRefLinks(
  inputSchema: any, schemaRefLibrary: any, schemaRecursiveRefMap: any
) {
  let schema = _.cloneDeep(inputSchema);

  // Search schema for $ref links
  JsonPointer.forEachDeep(schema, (subSchema, thisPointer) => {
    if (hasOwn(subSchema, '$ref') && isString(subSchema['$ref'])) {
      const refPointer: string = JsonPointer.compile(subSchema['$ref']);
      const isRecursive: boolean = JsonPointer.isSubPointer(refPointer, thisPointer);

      // Save new target schemas in schemaRefLibrary
      if (hasValue(refPointer) && !hasOwn(schemaRefLibrary, refPointer)) {
        schemaRefLibrary[refPointer] = getSchemaReference(
          schema, refPointer, schemaRefLibrary
        );
      }

      // Save link in schemaRecursiveRefMap
      if (!schemaRecursiveRefMap.has(thisPointer)) {
        schemaRecursiveRefMap.set(thisPointer, refPointer);
      }

      // If a $ref link is not recursive in this location,
      // remove link and replace with copy of target schema
      if (!isRecursive) {
        const targetSchema: any = _.cloneDeep(schemaRefLibrary[refPointer]);
        if (isObject(targetSchema) && Object.keys(subSchema).length > 1) {
          for (let key in Object.keys(subSchema)) {
            if (key !== '$ref') { targetSchema[key] = subSchema[key]; }
          }
        }
        schema = JsonPointer.set(schema, thisPointer, targetSchema);

        // Save partial link in schemaRecursiveRefMap,
        // so it can be matched later if it is recursive somewhere else
        schemaRecursiveRefMap.set(refPointer, thisPointer);
      } else {

        // If a matching partial link exists, complete it
        let mappedReference: string = schemaRecursiveRefMap.get(refPointer);
        if (schemaRecursiveRefMap.has(refPointer) &&
          JsonPointer.isSubPointer(mappedReference, refPointer)
        ) {
          schemaRecursiveRefMap.set(refPointer, mappedReference);
        }
      }
    }
  }, true);

  // Add redirects for links to shared schemas (such as definitions)
  let addRedirects: Map<string, string> = new Map<string, string>();
  schemaRecursiveRefMap.forEach((toRef1, fromRef1) =>
    schemaRecursiveRefMap.forEach((toRef2, fromRef2) => {
      if (fromRef1 !== fromRef2 && fromRef1 !== toRef2) {
        if (JsonPointer.isSubPointer(toRef2, fromRef1)) {
          const newRef: string = fromRef2 + fromRef1.slice(toRef2.length);
          if (!schemaRecursiveRefMap.has(newRef)) {
            addRedirects.set(newRef, toRef1);
          }
        }
      }
    })
  );
  addRedirects.forEach((toRef, fromRef) => schemaRecursiveRefMap.set(fromRef, toRef));

  // Fix recursive references pointing to shared schemas
  schemaRecursiveRefMap.forEach((toRef1, fromRef1) =>
    schemaRecursiveRefMap.forEach((toRef2, fromRef2) => {
      if (fromRef1 !== fromRef2 && toRef1 === toRef2 &&
        JsonPointer.isSubPointer(fromRef1, fromRef2)
      ) {
        schemaRecursiveRefMap.set(fromRef2, fromRef1);
      }
    })
  );

  // Remove unmatched (non-recursive) partial links
  schemaRecursiveRefMap.forEach((toRef, fromRef) => {
    if (!JsonPointer.isSubPointer(toRef, fromRef)
      && !hasOwn(schemaRefLibrary, toRef)
    ) {
      schemaRecursiveRefMap.delete(fromRef);
    }
  });

  // // TODO: Create dataRecursiveRefMap from schemaRecursiveRefMap
  // this.schemaRecursiveRefMap.forEach((toRef, fromRef) => {
  //   this.dataRecursiveRefMap.set(
  //     JsonPointer.toDataPointer(fromRef, this.schema),
  //     JsonPointer.toDataPointer(toRef, this.schema)
  //   );
  // });
  return schema;
}
