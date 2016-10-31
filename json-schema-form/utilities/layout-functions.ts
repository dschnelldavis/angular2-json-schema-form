import {
  AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, NgForm,
  ValidatorFn, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import {
  buildFormGroupTemplate, forEach, getFromSchema, getInputType, getControl,
  hasOwn, isArray, isEmpty, isInputRequired, isNumber, isObject, isPresent,
  isString, JsonPointer, toTitleCase, updateInputOptions,
} from './index';

/**
 * Layout function library:
 *
 * buildLayout:            Builds a complete layout from an input layout and schema
 *
 * buildLayoutFromSchema:  Builds a complete layout entirely from an input schema
 *
 * mapLayout:
 *
 * toIndexedPointer:
 *
 * buildTitleMap:
 */

/**
 * 'buildLayout' function
 *
 * @param {any[]} layout
 * @param {any} schema
 * @param {any} data
 * @param {any} formOptions
 * @param {any} fieldMap
 * @param {any} schemaRefLibrary
 * @param {any} layoutRefLibrary
 * @param {any} widgetLibrary
 * @param {any} formGroupTemplate
 * @return {any[]}
 */
export function buildLayout(
  layout: any[], schema: any, data: any, formOptions: any,
  fieldMap: any, schemaRefLibrary: any, layoutRefLibrary: any,
  widgetLibrary: any, formGroupTemplate: any
): any[] {
  let hasSubmitButton = formOptions.noSubmit;
  let formLayout = mapLayout(layout, (layoutItem, index, ignore, layoutPointer) => {
    let currentIndex: number = index;
    let newItem: any = {};
    if (isObject(layoutItem)) {
      newItem = layoutItem;
    } else if (JsonPointer.isJsonPointer(layoutItem)) {
      newItem.pointer = layoutItem;
    } else if (isString(layoutItem)) {
      newItem.key = layoutItem;
    } else {
      console.error('buildLayout error: Form layout element not recognized:');
      console.error(layoutItem);
      return null;
    }
    if (formOptions.setSchemaDefaults) {
      Object.assign(newItem, _.cloneDeep(formOptions.formDefaults));
    }
    newItem.layoutPointer = layoutPointer.replace(/\/\d+/g, '/-');
    let itemSchema: any = null;
    let schemaDefaultValue: any = null;
    if (hasOwn(newItem, 'key') || hasOwn(newItem, 'pointer')) {
      if (newItem.key === '*' || newItem.pointer === '*') {
        return buildLayoutFromSchema(
          schema, data, formOptions, fieldMap, schemaRefLibrary, layoutRefLibrary,
          widgetLibrary, formGroupTemplate, currentIndex, schema,
          newItem.layoutPointer.slice(0, -2)
        );
      }
      if (JsonPointer.isJsonPointer(newItem.key)) {
        newItem.pointer = JsonPointer.compile(newItem.key);
      } else {
        newItem.pointer =
          JsonPointer.compile(JsonPointer.parseObjectPath(newItem.key), '-');
      }
      newItem.name = JsonPointer.toKey(newItem.pointer);
      if (!hasOwn(fieldMap, newItem.pointer)) fieldMap[newItem.pointer] = {};
      if (hasOwn(fieldMap[newItem.pointer], 'schemaPointer')) {
        itemSchema = JsonPointer.get(schema, fieldMap[newItem.pointer]['schemaPointer']);
      } else {
        itemSchema = getFromSchema(schema, newItem.pointer);
      }
      if (itemSchema) {
        if (!hasOwn(newItem, 'type')) {
          newItem.type = getInputType(itemSchema);
        }
        if (!hasOwn(newItem, 'dataType')) {
          newItem.dataType = itemSchema.type;
        }
        updateInputOptions(newItem, itemSchema, data,
          formOptions.formDefaults, fieldMap, schemaRefLibrary, formGroupTemplate);

        // Present checkboxes as single control, rather than array
        if (newItem.type === 'checkboxes' && hasOwn(itemSchema, 'items')) {
          updateInputOptions(newItem, itemSchema.items, data,
            formOptions.formDefaults, fieldMap, schemaRefLibrary, formGroupTemplate);
        } else if (itemSchema.type === 'array' && hasOwn(itemSchema, 'items')) {
          if (isArray(itemSchema.items)) {
            newItem.tupleItems = itemSchema.items.length;
            if (hasOwn(itemSchema, 'additionalItems')) {
              newItem.listItems = hasOwn(itemSchema, 'maxItems') ?
                itemSchema.maxItems - itemSchema.items.length : true;
            } else {
              newItem.listItems = false;
            }
          } else {
            newItem.tupleItems = false;
            newItem.listItems = itemSchema.maxItems || true;
          }
        }
        if (!newItem.title && !isNumber(newItem.name)) {
          newItem.title = toTitleCase(newItem.name.replace(/_/g, ' '));
        }
        if (isInputRequired(schema, newItem.pointer)) {
          newItem.required = true;
          formOptions.fieldsRequired = true;
        }
        schemaDefaultValue = itemSchema.default;
      } else {
        // TODO: create item in FormGroup model from layout key
      }
      newItem.widget = widgetLibrary.getWidget(newItem.type);
      fieldMap[newItem.pointer]['inputType'] = newItem.type;
      fieldMap[newItem.pointer]['widget'] = newItem.widget;
      if (newItem.type === 'array' && hasOwn(newItem, 'items')) {
        if (newItem.required && !newItem.minItems) newItem.minItems = 1;
        let arrayPointer: string = newItem.pointer + '/-';
        if (!hasOwn(fieldMap, arrayPointer)) fieldMap[arrayPointer] = {};
        fieldMap[arrayPointer]['inputType'] = 'section';

        // Fix insufficiently nested array item groups
        let arrayItemGroup = [];
        let arrayItemGroupTemplate = [];
        let length: number = arrayPointer.length;
        let newIndex = 0;
        for (let i = newItem.items.length - 1, l = 0; i >= l; i--) {
          let subItem = newItem.items[i];
          if (subItem.pointer.slice(0, length) === arrayPointer) {
            let arrayItem = newItem.items.splice(i, 1)[0];
            let arrayItemTemplate = mapLayout([arrayItem],
              (itemLayoutItem, itemIndex, itemIgnore, itemLayoutPointer) => {
                itemLayoutItem.layoutPointer = itemLayoutItem.layoutPointer
                  .replace(newItem.layoutPointer, newItem.layoutPointer + '/items/-');
                return itemLayoutItem;
              }
            )[0];
            arrayItemGroupTemplate.unshift(arrayItemTemplate);
            arrayItem.pointer = newItem.pointer + '/0' + arrayItem.pointer.slice(length);
            arrayItem.layoutPointer = newItem.layoutPointer + '/items/-/items/-';
            arrayItemGroup.unshift(arrayItem);
            newIndex++;
          } else {
            subItem.isArrayItem = true;
          }
        }
        if (arrayItemGroup.length) {
          newItem.items.push({
            'type': 'fieldset',
            'isArrayItem': true,
            'isRemovable': !newItem.minItems,
            'pointer': newItem.pointer + '/0',
            'layoutPointer': newItem.layoutPointer + '/items/-',
            'items': arrayItemGroup,
            'widget': widgetLibrary.getWidget('fieldset')
          });
        }

        // If schema type is array, save controlTemplate in layout
        // TODO: fix to set controlTemplate for all layout $ref links instead
        // if (schema.type === 'array') {
        //   newItem.formGroupTemplate = _.cloneDeep(
        //     JsonPointer.get(formGroupTemplate, templatePointer + '/controls/-')
        //   );
        //   if (isPresent(newItem.formGroupTemplate.value)) delete layout.formGroupTemplate.value;
        // }

        // TODO: check maxItems to verify adding new items is OK, and check
        // additionalItems for whether there is a different schema for new items
        layoutRefLibrary[arrayPointer] = newItem.items[newItem.items.length - 1];
        let buttonText: string = 'Add ';
        if (newItem.title) {
          buttonText += newItem.title;
        } else if (schema.title) {
          buttonText += 'to ' + schema.title;
        } else {
          buttonText += 'to ' +
            toTitleCase(JsonPointer.toKey(newItem.pointer).replace(/_/g, ' '));
        }
        let newItemRef: any = {
          'type': '$ref',
          'isArrayItem': true,
          'arrayItemType': 'list',
          'isRemovable': false,
          'layoutPointer': newItem.layoutPointer + '/items/-',
          '$ref': arrayPointer,
          '$refType': 'array',
          'title': buttonText,
          'widget': widgetLibrary.getWidget('$ref')
        };

        // TODO: If newItem doesn't have a title, look for title of array parent item ?
        if (!newItemRef.title && !isNumber(newItem.name) && newItem.name !== '-') {
          newItem.title = toTitleCase(newItem.name.replace(/_/g, ' '));
        }
        if (isString(JsonPointer.get(newItem, '/style/add'))) {
          newItemRef.style = newItem.style.add;
          delete newItem.style.add;
          if (isEmpty(newItem.style)) delete newItem.style;
        }
        newItem.items.push(newItemRef);

      }
    } else if (hasOwn(newItem, 'type')) {
      newItem.widget = widgetLibrary.getWidget(newItem.type);
    }
    return newItem;
  });
  if (!hasSubmitButton) {
    // TODO: add submit button
  }
  return formLayout;
}

/**
 * 'buildLayoutFromSchema' function
 *
 * @param {any} schema
 * @param {any} data
 * @param {any} formOptions
 * @param {any} fieldMap
 * @param {any} schemaRefLibrary
 * @param {any} layoutRefLibrary
 * @param {any} widgetLibrary
 * @param {any} formGroupTemplate
 * @param {number = 0} layoutIndex
 * @param {any = schema} rootSchema
 * @param {string = ''} layoutPointer
 * @param {string = ''} schemaPointer
 * @param {string = ''} dataPointer
 * @return {any}
 */
export function buildLayoutFromSchema(
  schema: any, data: any, formOptions: any, fieldMap: any,
  schemaRefLibrary: any, layoutRefLibrary: any, widgetLibrary: any,
  formGroupTemplate: any, layoutIndex: number = 0, rootSchema: any = schema,
  layoutPointer: string = '', schemaPointer: string = '', dataPointer: string = '',
  isArrayItem: boolean = false, arrayItemType: string = '', isRemovable: boolean = null
): any {
  if (!hasOwn(schema, 'type') && !hasOwn(schema, 'x-schema-form') &&
    !hasOwn(schema, '$ref')) return null;
  let newItem: any = {};
  if (formOptions.setSchemaDefaults) {
    Object.assign(newItem, _.cloneDeep(formOptions.formDefaults));
  }
  if (hasOwn(schema, 'x-schema-form')) {
    Object.assign(newItem, schema['x-schema-form']);
  }
  newItem.pointer = dataPointer;
  newItem.layoutPointer = layoutPointer.replace(/\/\d+/g, '/-');
  newItem.name = JsonPointer.toKey(newItem.pointer);
  newItem.type = getInputType(schema);
  newItem.dataType = schema.type;
  if (isArrayItem === true) newItem.isArrayItem = true;
  if (isPresent(arrayItemType)) newItem.arrayItemType = arrayItemType;
  if (isPresent(isRemovable)) newItem.isRemovable = isRemovable;
  newItem.widget = widgetLibrary.getWidget(newItem.type);
  if (dataPointer !== '') {
    if (!hasOwn(fieldMap, newItem.pointer)) fieldMap[newItem.pointer] = {};
    fieldMap[newItem.pointer]['schemaPointer'] = schemaPointer;
    fieldMap[newItem.pointer]['inputType'] = newItem.type;
    fieldMap[newItem.pointer]['widget'] = newItem.widget;
  }
  updateInputOptions(newItem, schema, data,
      formOptions.formDefaults, fieldMap, schemaRefLibrary, formGroupTemplate);
  if (!newItem.title && !isNumber(newItem.name) && newItem.name !== '-') {
    newItem.title = toTitleCase(newItem.name);
  }
  // TODO: check for unresolved circular references and add $ref items to layout
  switch (newItem.type) {
    case 'fieldset':
      let newFieldset: any[] = [];
      let index: number = dataPointer === '' ? layoutIndex : 0;
      let newKeys: string[];
      let subObject: string = 'properties';
      if (hasOwn(schema, 'properties')) {
        newKeys = hasOwn(schema.properties, 'ui:order') ?
          schema['properties']['ui:order'] : Object.keys(schema['properties']);
      } else if (hasOwn(schema, 'additionalProperties')) {
        subObject = 'additionalProperties';
        newKeys = Object.keys(schema['additionalProperties']);
      }
      for (let key of newKeys) {
        if (hasOwn(schema[subObject], key)) {
          let item = schema[subObject][key];
          let innerItem = buildLayoutFromSchema(
            item, data, formOptions, fieldMap,
            schemaRefLibrary, layoutRefLibrary, widgetLibrary,
            formGroupTemplate, index, rootSchema,
            newItem.layoutPointer + '/-',
            schemaPointer + '/properties/' + key,
            dataPointer + '/' + key, false
          );
          if (innerItem) {
            if (isInputRequired(schema, '/' + key)) {
              innerItem.required = true;
              formOptions.fieldsRequired = true;
            }
            newFieldset.push(innerItem);
            index++;
          }
        }
      }
      if (dataPointer === '') {
        newItem = newFieldset;
      } else {
        newItem.items = newFieldset;
      }
    break;
    case 'array':
      newItem.items = [];
      let templateControl: any = getControl(formGroupTemplate, dataPointer);
      let templateArray: any[] = [];
      if (hasOwn(templateControl, 'controls')) {
        templateArray = templateControl['controls'];
      }
      if (!newItem.minItems && isInputRequired(rootSchema, schemaPointer)) {
        newItem.minItems = 1;
      }
      let minItems: number = newItem.minItems || 0;
      let maxItems: number = newItem.maxItems || 1000000;
      let additionalItems: any = null;
      if (isArray(schema.items)) {
        newItem.tupleItems = schema.items.length;
        if (hasOwn(schema, 'additionalItems')) {
          newItem.listItems = hasOwn(schema, 'maxItems') ?
            schema.maxItems - schema.items.length : true;
        } else {
          newItem.listItems = false;
        }
        newItem.items = _.filter(_.map(schema.items, (item, i) =>
          buildLayoutFromSchema(
            item, data, formOptions, fieldMap,
            schemaRefLibrary, layoutRefLibrary, widgetLibrary,
            formGroupTemplate, i, rootSchema,
            newItem.layoutPointer + '/items/-',
            schemaPointer + '/items/' + i,
            dataPointer + '/' + i,
            true, 'tuple', i >= minItems
          )
        ));
        if (newItem.items.length < maxItems &&
          hasOwn(schema, 'additionalItems') && schema.additionalItems !== false
        ) {
          if (newItem.items.length < templateArray.length) {
            for (let i = newItem.items.length, l = templateArray.length; i < l; i++) {
              newItem.items.push(buildLayoutFromSchema(
                schema.additionalItems, data, formOptions, fieldMap,
                schemaRefLibrary, layoutRefLibrary, widgetLibrary,
                formGroupTemplate, i, rootSchema,
                newItem.layoutPointer + '/items/-',
                schemaPointer + '/items/' + i,
                dataPointer + '/' + i,
                true, 'list', i >= minItems
              ));
            }
          } else if (newItem.items.length > templateArray.length) {
            for (let i = templateArray.length, l = newItem.items.length; i < l; i++) {
              templateArray.push(buildFormGroupTemplate(
                schema.additionalItems, schemaRefLibrary, fieldMap
              ));
            }
          }
          additionalItems = buildLayoutFromSchema(
            schema.additionalItems, data, formOptions, fieldMap,
            schemaRefLibrary, layoutRefLibrary, widgetLibrary,
            formGroupTemplate, -1, rootSchema,
            newItem.layoutPointer + '/items/-',
            schemaPointer + '/items/-',
            dataPointer + '/-',
            true, 'list', true
          );
        }
      } else {
        newItem.tupleItems = false;
        newItem.listItems = schema.maxItems || true;
        for (let i of Object.keys(templateArray).map(k => parseInt(k, 10))) {
          newItem.items.push(buildLayoutFromSchema(
            schema.items, data, formOptions, fieldMap,
            schemaRefLibrary, layoutRefLibrary, widgetLibrary,
            formGroupTemplate, i, rootSchema,
            newItem.layoutPointer + '/items/-',
            schemaPointer + '/items/' + i,
            dataPointer + '/' + i,
            true, 'list', i >= minItems
          ));
        }
        additionalItems = buildLayoutFromSchema(
          schema.items, data, formOptions, fieldMap,
          schemaRefLibrary, layoutRefLibrary, widgetLibrary,
          formGroupTemplate, -1, rootSchema,
          newItem.layoutPointer + '/items/-',
          schemaPointer + '/items/-',
          dataPointer + '/-',
          true, 'list', true
        );
      }

      // If addable items, save to layoutRefLibrary, and add $ref item to layout
      if (additionalItems) {
        layoutRefLibrary[dataPointer + '/-'] = additionalItems;
        delete layoutRefLibrary[dataPointer + '/-']['key'];
        delete layoutRefLibrary[dataPointer + '/-']['name'];
        let buttonText: string = 'Add ';
        if (additionalItems.title) {
          buttonText += additionalItems.title;
        } else if (schema.title) {
          buttonText += 'to ' + schema.title;
        } else {
          buttonText += 'to ' +
            toTitleCase(JsonPointer.toKey(dataPointer).replace(/_/g, ' '));
        }
        newItem.items.push({
          'type': '$ref',
          'isArrayItem': true,
          'arrayItemType': 'list',
          'isRemovable': false,
          'layoutPointer': newItem.layoutPointer + '/items/-',
          '$ref': dataPointer + '/-',
          '$refType': 'array',
          'title': buttonText,
          'widget': widgetLibrary.getWidget('$ref')
        });
      }
    break;
  }
  return newItem;
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
  let indexPad: number = 0;
  let newLayout: any[] = [];
  forEach(layout, (item, index) => {
    let realIndex = +index + indexPad;
    let newPath = path + '/' + realIndex;
    let newItem: any = item;
    if (isObject(newItem)) {
      if (isArray(newItem.items)) {
        newItem.items = mapLayout(newItem.items, fn, rootLayout, newPath + '/items');
      } else if (isArray(newItem.tabs)) {
        newItem.tabs = mapLayout(newItem.tabs, fn, rootLayout, newPath + '/tabs');
      }
    }
    newItem = fn(newItem, realIndex, rootLayout, newPath);
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
 * 'toIndexedPointer' function
 *
 * Merges an array of numeric indexes and a generic pointer to create an
 * indexed pointer for a specific item.
 *
 * For example, merging the generic pointer '/foo/-/bar/-/baz' and
 * the array [4, 2] would result in the indexed pointer '/foo/4/bar/2/baz'
 *
 * @function
 * @param {string | string[]} pointer - The generic pointer
 * @param {number[]} indexArray - The array of numeric indexes
 * @return {string} - The merged pointer with indexes
**/
export function toIndexedPointer(pointer, indexArray) {
  let mergedPointer = pointer;
  for (let pointerIndex of indexArray) {
    mergedPointer = mergedPointer.replace('/-', '/' + pointerIndex);
  }
  return mergedPointer;
};

/**
 * 'buildTitleMap' function
 *
 * @param {any} titleMap -
 * @param {any} enumList -
 * @param {boolean = false} fieldRequired -
 * @return { { name: any, value: any}[] }
 */
export function buildTitleMap(
  titleMap: any, enumList: any, fieldRequired: boolean = true
): { name: any, value: any}[] {
  let newTitleMap: { name: any, value: any}[] = [];
  let hasEmptyValue: boolean = false;
  if (titleMap) {
    if (isArray(titleMap)) {
      if (enumList) {
        for (let i of Object.keys(titleMap)) {
          if (isObject(titleMap[i])) { // JSON Form / Angular Schema Form style
            let value: any = titleMap[i].value;
            if (enumList.indexOf(value) !== -1) {
              let name: any = titleMap[i].name;
              newTitleMap.push({ name, value });
              if (!value) hasEmptyValue = true;
            }
          } else if (isString(titleMap[i])) { // React Jsonschema Form style
            if (i < enumList.length) {
              let name: any = titleMap[i];
              let value: any = enumList[i];
              newTitleMap.push({ name, value });
              if (!value) hasEmptyValue = true;
            }
          }
        }
      } else {
        newTitleMap = titleMap;
        if (!fieldRequired) hasEmptyValue = !!newTitleMap.filter(i => !i.value).length;
      }
    } else if (enumList) {
      for (let i of Object.keys(enumList)) {
        let value: any = enumList[i];
        if (hasOwn(titleMap, value)) {
          let name: any = titleMap[value];
          newTitleMap.push({ name, value });
          if (!value) hasEmptyValue = true;
        }
      }
    } else {
      for (let name of Object.keys(titleMap)) {
        let value: any = titleMap[name];
        newTitleMap.push({ name, value });
        if (!value) hasEmptyValue = true;
      }
    }
  } else if (enumList) {
    for (let i of Object.keys(enumList)) {
      let name: any = enumList[i];
      let value: any = enumList[i];
      newTitleMap.push({ name, value});
      if (!value) hasEmptyValue = true;
    }
  } else {
    newTitleMap = [{ name: 'True', value: true }, { name: 'False', value: false }];
  }
  if (!fieldRequired && !hasEmptyValue) {
    newTitleMap.unshift({ name: '', value: '' });
  }
  return newTitleMap;
}
