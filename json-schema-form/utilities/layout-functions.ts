import { FormGroup, FormBuilder } from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';
import * as Immutable from 'immutable';

import {
  buildFormGroupTemplate, forEach, getFromSchema, getInputType, getControl,
  hasOwn, isArray, isEmpty, isInputRequired, isNumber, isObject, isPresent,
  isString, JsonPointer, toControlPointer, toTitleCase, updateInputOptions,
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
 * buildTitleMap:
 *
 * toIndexedPointer:
 *
 * toGenericPointer:
 */

/**
 * 'buildLayout' function
 *
 * @param {any} formOptions
 * @return {any[]}
 */
export function buildLayout(formOptions: any): any[] {
  let hasSubmitButton = !formOptions.addSubmit;
  let formLayout = mapLayout(formOptions.layout, (layoutItem, index, ignore, layoutPointer) => {
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
    if (formOptions.globalOptions.setSchemaDefaults) {
      newItem = Object.assign(_.cloneDeep(formOptions.globalOptions.formDefaults), newItem);
    }
    newItem.layoutPointer = layoutPointer.replace(/\/\d+/g, '/-');
    let itemSchema: any = null;
    let schemaDefaultValue: any = null;
    if (hasOwn(newItem, 'key') || hasOwn(newItem, 'pointer')) {
      if (newItem.key === '*' || newItem.pointer === '*') {
        return buildLayoutFromSchema(
          formOptions, currentIndex, newItem.layoutPointer.slice(0, -2)
        );
      }
      if (JsonPointer.isJsonPointer(newItem.key)) {
        newItem.pointer = JsonPointer.compile(newItem.key);
      } else {
        newItem.pointer =
          JsonPointer.compile(JsonPointer.parseObjectPath(newItem.key), '-');
      }
      newItem.name = JsonPointer.toKey(newItem.pointer);
      if (!hasOwn(formOptions.dataMap, newItem.pointer)) formOptions.dataMap[newItem.pointer] = {};
      if (hasOwn(formOptions.dataMap[newItem.pointer], 'schemaPointer')) {
        itemSchema = JsonPointer.get(formOptions.schema, formOptions.dataMap[newItem.pointer]['schemaPointer']);
      } else {
        itemSchema = getFromSchema(formOptions.schema, newItem.pointer);
      }
      if (itemSchema) {
        if (!hasOwn(newItem, 'type')) {
          newItem.type = getInputType(itemSchema);
        }
        if (!hasOwn(newItem, 'dataType')) {
          newItem.dataType = itemSchema.type;
        }
        updateInputOptions(newItem, itemSchema, formOptions);

        // Present checkboxes as single control, rather than array
        if (newItem.type === 'checkboxes' && hasOwn(itemSchema, 'items')) {
          updateInputOptions(newItem, itemSchema.items, formOptions);
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
        if (isInputRequired(formOptions.schema, newItem.pointer)) {
          newItem.required = true;
          formOptions.fieldsRequired = true;
        }
        schemaDefaultValue = itemSchema.default;
      } else {
        // TODO: create item in FormGroup model from layout key
      }
      newItem.widget = formOptions.widgetLibrary.getWidget(newItem.type);
      formOptions.dataMap[newItem.pointer]['inputType'] = newItem.type;
      formOptions.dataMap[newItem.pointer]['widget'] = newItem.widget;
      if (newItem.type === 'array' && hasOwn(newItem, 'items')) {
        if (newItem.required && !newItem.minItems) newItem.minItems = 1;
        let arrayPointer: string = newItem.pointer + '/-';
        if (!hasOwn(formOptions.dataMap, arrayPointer)) formOptions.dataMap[arrayPointer] = {};
        formOptions.dataMap[arrayPointer]['inputType'] = 'section';

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
            'widget': formOptions.widgetLibrary.getWidget('fieldset')
          });
        }

        // TODO: check maxItems to verify adding new items is OK, and check
        // additionalItems for whether there is a different schema for new items
        formOptions.layoutRefLibrary[arrayPointer] = newItem.items[newItem.items.length - 1];
        let buttonText: string = 'Add ';
        if (newItem.title) {
          buttonText += newItem.title;
        } else if (formOptions.schema.title) {
          buttonText += 'to ' + formOptions.schema.title;
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
          'widget': formOptions.widgetLibrary.getWidget('$ref')
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
      newItem.widget = formOptions.widgetLibrary.getWidget(newItem.type);
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
 * @param {any} formOptions
 * @param {number = 0} layoutIndex
 * @param {string = ''} layoutPointer
 * @param {string = ''} schemaPointer
 * @param {string = ''} dataPointer
 * @return {any}
 */
export function buildLayoutFromSchema(
  formOptions: any, layoutIndex: number = 0, layoutPointer: string = '',
  schemaPointer: string = '', dataPointer: string = '',
  isArrayItem: boolean = false, arrayItemType: string = '',
  isRemovable: boolean = null
): any {
  const schema = JsonPointer.get(formOptions.schema, schemaPointer);
  if (!hasOwn(schema, 'type') && !hasOwn(schema, 'x-schema-form') &&
    !hasOwn(schema, '$ref')) return null;
  let newItem: any = {};
  if (formOptions.globalOptions.setSchemaDefaults) {
    newItem = _.cloneDeep(formOptions.globalOptions.formDefaults);
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
  newItem.widget = formOptions.widgetLibrary.getWidget(newItem.type);
  if (dataPointer !== '') {
    if (!hasOwn(formOptions.dataMap, newItem.pointer)) formOptions.dataMap[newItem.pointer] = {};
    formOptions.dataMap[newItem.pointer]['schemaPointer'] = schemaPointer;
    formOptions.dataMap[newItem.pointer]['inputType'] = newItem.type;
    formOptions.dataMap[newItem.pointer]['widget'] = newItem.widget;
  }
  updateInputOptions(newItem, schema, formOptions);
  if (!newItem.title && !isNumber(newItem.name) && newItem.name !== '-') {
    newItem.title = toTitleCase(newItem.name);
  }
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
          // let item = schema[subObject][key];
          const newLayoutPointer = newItem.layoutPointer === '' ?
            '/-'  : newItem.layoutPointer + '/items/-';
          let innerItem = buildLayoutFromSchema(
            formOptions, index,
            newLayoutPointer,
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
      let templateControl: any =
        getControl(formOptions.formGroupTemplate, dataPointer);
      let templateArray: any[] = [];
      if (hasOwn(templateControl, 'controls')) {
        templateArray = templateControl['controls'];
      }
      if (!newItem.minItems && isInputRequired(formOptions.schema, schemaPointer)) {
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
            formOptions, i,
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
                formOptions, i,
                newItem.layoutPointer + '/items/-',
                schemaPointer + '/additionalItems',
                dataPointer + '/' + i,
                true, 'list', i >= minItems
              ));
            }
          } else if (newItem.items.length > templateArray.length) {
            for (let i = templateArray.length, l = newItem.items.length; i < l; i++) {
              templateArray.push(buildFormGroupTemplate(
                formOptions,
                schemaPointer + '/additionalItems',
                dataPointer + '/' + i,
                toControlPointer(formOptions.formGroupTemplate, dataPointer + '/' + i),
                false
              ));
            }
          }
          additionalItems = buildLayoutFromSchema(
            formOptions, -1,
            newItem.layoutPointer + '/items/-',
            schemaPointer + '/additionalItems',
            dataPointer + '/-',
            true, 'list', true
          );
        }
      } else {
        newItem.tupleItems = false;
        newItem.listItems = schema.maxItems || true;
        for (let i of Object.keys(templateArray).map(k => parseInt(k, 10))) {
          newItem.items.push(buildLayoutFromSchema(
            formOptions, i,
            newItem.layoutPointer + '/items/-',
            schemaPointer + '/items',
            dataPointer + '/' + i,
            true, 'list', i >= minItems
          ));
        }
        additionalItems = buildLayoutFromSchema(
          formOptions, -1,
          newItem.layoutPointer + '/items/-',
          schemaPointer + '/items',
          dataPointer + '/-',
          true, 'list', true
        );
      }

      // If addable items, save to layoutRefLibrary, and add $ref item to layout
      if (additionalItems) {
        formOptions.layoutRefLibrary[dataPointer + '/-'] = additionalItems;
        delete formOptions.layoutRefLibrary[dataPointer + '/-']['key'];
        delete formOptions.layoutRefLibrary[dataPointer + '/-']['name'];
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
          'widget': formOptions.widgetLibrary.getWidget('$ref')
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
      } else if (isObject(newItem.items)) {
        newItem.items = mapLayout([newItem.items], fn, rootLayout, newPath + '/items');
      } else if (isArray(newItem.tabs)) {
        newItem.tabs = mapLayout(newItem.tabs, fn, rootLayout, newPath + '/tabs');
      } else if (isObject(newItem.tabs)) {
        newItem.tabs = mapLayout([newItem.tabs], fn, rootLayout, newPath + '/tabs');
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
export function toIndexedPointer(pointer: string, indexArray: number[]) {
  let indexedPointer = pointer;
  for (let pointerIndex of indexArray) {
    indexedPointer = indexedPointer.replace('/-', '/' + pointerIndex);
  }
  return indexedPointer;
};

/**
 * 'toGenericPointer' function
 *
 * Compares an indexed pointer to an array map and removes list array
 * indexes (but leaves tuple arrray indexes) to create a generic pointer.
 *
 * For example, comparing the indexed pointer '/foo/1/bar/2/baz/3' and
 * the arrayMap [['/foo', 0], ['/foo/-/bar', 3], ['/foo/-/bar/2/baz', 0]]
 * would result in the generic pointer '/foo/-/bar/2/baz/-'
 *
 * The structure of the arrayMap is: ['path to array', number of tuple items]
 *
 * @function
 * @param {string | string[]} pointer - The generic pointer
 * @param {number[]} indexArray - The array of numeric indexes
 * @return {string} - The merged pointer with indexes
**/
export function toGenericPointer(pointer: string, arrayMap: Map<string, number>) {
  let pointerArray = JsonPointer.parse(pointer);
  for (let i = 1, l = pointerArray.length; i < l; i++) {
    const subPointer = JsonPointer.compile(pointerArray.slice(0, i));
    if (arrayMap.has(subPointer) && arrayMap.get(subPointer) <= +pointerArray[i]) {
      pointerArray[i] = '-';
    }
  }
  return JsonPointer.compile(pointerArray);
};
