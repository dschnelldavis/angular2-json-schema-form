import { FormGroup, FormBuilder } from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';
import * as Immutable from 'immutable';

import {
  buildFormGroupTemplate, copy, forEach, getFromSchema, getInputType, getControl,
  hasOwn, isArray, isEmpty, isInputRequired, isNumber, isObject, isDefined,
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
 * @param {any} formSettings
 * @return {any[]}
 */
export function buildLayout(formSettings: any): any[] {
  let hasSubmitButton = !formSettings.addSubmit;
  let formLayout =
    mapLayout(formSettings.layout, (layoutNode, index, layoutPointer) => {

    let currentIndex: number = index;
    let newNode: any = {};
    if (isObject(layoutNode)) {
      newNode = layoutNode;
    } else if (JsonPointer.isJsonPointer(layoutNode)) {
      newNode.dataPointer = layoutNode;
    } else if (isString(layoutNode)) {
      newNode.key = layoutNode;
    } else {
      console.error('buildLayout error: Form layout element not recognized:');
      console.error(layoutNode);
      return null;
    }
    newNode.options = {};
    if (formSettings.globalOptions.setSchemaDefaults) {
      newNode = Object.assign(_.cloneDeep(formSettings.globalOptions.formDefaults), newNode);
    }
    newNode.layoutPointer = layoutPointer.replace(/\/\d+/g, '/-');
    let itemSchema: any = null;
    let schemaDefaultValue: any = null;
    if (hasOwn(newNode, 'key') || hasOwn(newNode, 'dataPointer')) {
      if (newNode.key === '*' || newNode.dataPointer === '*') {
        return buildLayoutFromSchema(
          formSettings, currentIndex, newNode.layoutPointer.slice(0, -2)
        );
      }
      if (!hasOwn(newNode, 'dataPointer')) {
        if (JsonPointer.isJsonPointer(newNode.key)) {
          newNode.dataPointer = JsonPointer.compile(newNode.key);
        } else {
          newNode.dataPointer =
            JsonPointer.compile(JsonPointer.parseObjectPath(newNode.key), '-');
        }
      }
      newNode.name = JsonPointer.toKey(newNode.dataPointer);
      if (!formSettings.dataMap.has(newNode.dataPointer)) {
        formSettings.dataMap.set(newNode.dataPointer, new Map);
      };
      if (formSettings.dataMap.get(newNode.dataPointer).has('schemaPointer')) {
        itemSchema = JsonPointer.get(formSettings.schema,
          formSettings.dataMap.get(newNode.dataPointer).get('schemaPointer')
        );
      } else {
        itemSchema = getFromSchema(formSettings.schema, newNode.dataPointer);
      }
      if (itemSchema) {
console.log('schema:' + layoutPointer);
        if (!hasOwn(newNode, 'type')) {
          newNode.type = getInputType(itemSchema);
        }
        if (!hasOwn(newNode, 'dataType')) {
          newNode.dataType = itemSchema.type;
        }
console.log(_.cloneDeep(newNode));
        updateInputOptions(newNode, itemSchema, formSettings);
console.log(_.cloneDeep(newNode));
        // Present checkboxes as single control, rather than array
        if (newNode.type === 'checkboxes' && hasOwn(itemSchema, 'items')) {
          updateInputOptions(newNode, itemSchema.items, formSettings);
        } else if (itemSchema.type === 'array' && hasOwn(itemSchema, 'items')) {
          if (isArray(itemSchema.items)) {
            newNode.tupleItems = itemSchema.items.length;
            if (hasOwn(itemSchema, 'additionalItems')) {
              newNode.listItems = hasOwn(itemSchema, 'maxItems') ?
                itemSchema.maxItems - itemSchema.items.length : true;
            } else {
              newNode.listItems = false;
            }
          } else {
            newNode.tupleItems = false;
            newNode.listItems = itemSchema.maxItems || true;
          }
        }
        if (!newNode.options.title && !isNumber(newNode.name)) {
          newNode.options.title = toTitleCase(newNode.name.replace(/_/g, ' '));
        }
        if (isInputRequired(formSettings.schema, newNode.dataPointer)) {
          newNode.required = true;
          formSettings.fieldsRequired = true;
        }
        schemaDefaultValue = itemSchema.default;
      } else {
        // TODO: create item in FormGroup model from layout key
        updateInputOptions(newNode, {}, formSettings);
      }
      newNode.widget = formSettings.widgetLibrary.getWidget(newNode.type);
      formSettings.dataMap.get(newNode.dataPointer).set('inputType', newNode.type);
      formSettings.dataMap.get(newNode.dataPointer).set('widget', newNode.widget);
      if (newNode.type === 'array' && hasOwn(newNode, 'items')) {
        if (newNode.required && !newNode.minItems) newNode.minItems = 1;
        let arrayPointer: string = newNode.dataPointer + '/-';
        if (!formSettings.dataMap.has(arrayPointer)) {
          formSettings.dataMap.set(arrayPointer, new Map);
        }
        formSettings.dataMap.get(arrayPointer).set('inputType', 'section');

        // Fix insufficiently nested array item groups
        let arrayItemGroup = [];
        let arrayItemGroupTemplate = [];
        let length: number = arrayPointer.length;
        let newIndex = 0;
        for (let i = newNode.items.length - 1, l = 0; i >= l; i--) {
          let subItem = newNode.items[i];
          if (subItem.dataPointer.slice(0, length) === arrayPointer) {
            let arrayItem = newNode.items.splice(i, 1)[0];
            let arrayItemTemplate = mapLayout([arrayItem], templateItem => {
              templateItem.layoutPointer = templateItem.layoutPointer
                .replace(newNode.layoutPointer, newNode.layoutPointer + '/items/-');
              return templateItem;
            })[0];
            arrayItemGroupTemplate.unshift(arrayItemTemplate);
            arrayItem.dataPointer = newNode.dataPointer + '/0' + arrayItem.dataPointer.slice(length);
            arrayItem.layoutPointer = newNode.layoutPointer + '/items/-/items/-';
            arrayItemGroup.unshift(arrayItem);
            newIndex++;
          } else {
            subItem.isArrayItem = true;
          }
        }
        if (arrayItemGroup.length) {
          newNode.items.push({
            isArrayItem: true,
            items: arrayItemGroup,
            layoutPointer: newNode.layoutPointer + '/items/-',
            options: { isRemovable: !newNode.minItems, },
            dataPointer: newNode.dataPointer + '/0',
            type: 'fieldset',
            widget: formSettings.widgetLibrary.getWidget('fieldset'),
          });
        }

        // TODO: check maxItems to verify adding new items is OK, and check
        // additionalItems for whether there is a different schema for new items
        formSettings.layoutRefLibrary[arrayPointer] = newNode.items[newNode.items.length - 1];
        let buttonText: string = 'Add ';
        if (newNode.options.title) {
          buttonText += newNode.options.title;
        } else if (formSettings.schema.title) {
          buttonText += 'to ' + formSettings.schema.title;
        } else {
          buttonText += 'to ' +
            toTitleCase(JsonPointer.toKey(newNode.dataPointer).replace(/_/g, ' '));
        }
        let newNodeRef: any = {
          arrayItemType: 'list',
          layoutPointer: newNode.layoutPointer + '/items/-',
          isArrayItem: true,
          options: { isRemovable: false, },
          title: buttonText,
          type: '$ref',
          widget: formSettings.widgetLibrary.getWidget('$ref'),
          '$ref': arrayPointer,
          '$refType': 'array',
        };

        // TODO: If newNode doesn't have a title, look for title of array parent item ?
        if (!newNodeRef.options.title && !isNumber(newNode.name) && newNode.name !== '-') {
          newNode.options.title = toTitleCase(newNode.name.replace(/_/g, ' '));
        }
        if (isString(JsonPointer.get(newNode, '/style/add'))) {
          newNodeRef.options.fieldStyle = newNode.style.add;
          delete newNode.style.add;
          if (isEmpty(newNode.style)) delete newNode.style;
        }
        newNode.items.push(newNodeRef);

      }
    } else if (hasOwn(newNode, 'type')) {
console.log('no key:' + layoutPointer);
      newNode.widget = formSettings.widgetLibrary.getWidget(newNode.type);
      updateInputOptions(newNode, {}, formSettings);
    }
    return newNode;
  });
  if (!hasSubmitButton) {
    formLayout.push(buildLayout({ type: 'submit', title: 'Submit' }));
  }
  return formLayout;
}

/**
 * 'buildLayoutFromSchema' function
 *
 * @param {any} formSettings
 * @param {number = 0} layoutIndex
 * @param {string = ''} layoutPointer
 * @param {string = ''} schemaPointer
 * @param {string = ''} dataPointer
 * @return {any}
 */
export function buildLayoutFromSchema(
  formSettings: any, layoutIndex: number = 0, layoutPointer: string = '',
  schemaPointer: string = '', dataPointer: string = '',
  isArrayItem: boolean = false, arrayItemType: string = null,
  isRemovable: boolean = null
): any {
  const schema = JsonPointer.get(formSettings.schema, schemaPointer);
  if (!hasOwn(schema, 'type') && !hasOwn(schema, 'x-schema-form') &&
    !hasOwn(schema, '$ref')) return null;
  let newNode: any = { options: {} };
  if (formSettings.globalOptions.setSchemaDefaults) {
    newNode.options = _.cloneDeep(formSettings.globalOptions.formDefaults);
  }
  if (hasOwn(schema, 'x-schema-form')) {
    Object.assign(newNode.options, schema['x-schema-form']);
  }
  newNode.dataPointer = dataPointer;
  newNode.layoutPointer = layoutPointer.replace(/\/\d+/g, '/-');
  newNode.name = JsonPointer.toKey(newNode.dataPointer);
  newNode.type = getInputType(schema);
  newNode.dataType = schema.type;
  if (isArrayItem === true) newNode.isArrayItem = true;
  if (isDefined(arrayItemType)) newNode.arrayItemType = arrayItemType;
  if (isDefined(isRemovable)) newNode.isRemovable = isRemovable;
  newNode.widget = formSettings.widgetLibrary.getWidget(newNode.type);
  if (dataPointer !== '') {
    if (!formSettings.dataMap.has(newNode.dataPointer)) {
      formSettings.dataMap.set(newNode.dataPointer, new Map);
    }
    formSettings.dataMap.get(newNode.dataPointer).set('schemaPointer', schemaPointer);
    formSettings.dataMap.get(newNode.dataPointer).set('inputType', newNode.type);
    formSettings.dataMap.get(newNode.dataPointer).set('widget', newNode.widget);
  }
  updateInputOptions(newNode, schema, formSettings);
  if (!newNode.options.title && !isNumber(newNode.name) && newNode.name !== '-') {
    newNode.options.title = toTitleCase(newNode.name.replace(/_/g, ' '));
  }
  switch (newNode.type) {
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
          const newLayoutPointer = newNode.layoutPointer === '' ?
            '/-'  : newNode.layoutPointer + '/items/-';
          let innerItem = buildLayoutFromSchema(
            formSettings, index,
            newLayoutPointer,
            schemaPointer + '/properties/' + key,
            dataPointer + '/' + key, false
          );
          if (innerItem) {
            if (isInputRequired(schema, '/' + key)) {
              innerItem.required = true;
              formSettings.fieldsRequired = true;
            }
            newFieldset.push(innerItem);
            index++;
          }
        }
      }
      if (dataPointer === '') {
        newNode = newFieldset;
      } else {
        newNode.items = newFieldset;
      }
    break;
    case 'array':
      newNode.items = [];
      let templateControl: any =
        getControl(formSettings.formGroupTemplate, dataPointer);
      let templateArray: any[] = [];
      if (hasOwn(templateControl, 'controls')) {
        templateArray = templateControl['controls'];
      }
      if (!newNode.minItems && isInputRequired(formSettings.schema, schemaPointer)) {
        newNode.minItems = 1;
      }
      let minItems: number = newNode.minItems || 0;
      let maxItems: number = newNode.maxItems || 1000000;
      let additionalItems: any = null;
      if (isArray(schema.items)) {
        newNode.tupleItems = schema.items.length;
        if (hasOwn(schema, 'additionalItems')) {
          newNode.listItems = hasOwn(schema, 'maxItems') ?
            schema.maxItems - schema.items.length : true;
        } else {
          newNode.listItems = false;
        }
        newNode.items = _.filter(_.map(schema.items, (item, i) =>
          buildLayoutFromSchema(
            formSettings, i,
            newNode.layoutPointer + '/items/-',
            schemaPointer + '/items/' + i,
            dataPointer + '/' + i,
            true, 'tuple', i >= minItems
          )
        ));
        if (newNode.items.length < maxItems &&
          hasOwn(schema, 'additionalItems') && schema.additionalItems !== false
        ) {
          if (newNode.items.length < templateArray.length) {
            for (let i = newNode.items.length, l = templateArray.length; i < l; i++) {
              newNode.items.push(buildLayoutFromSchema(
                formSettings, i,
                newNode.layoutPointer + '/items/-',
                schemaPointer + '/additionalItems',
                dataPointer + '/' + i,
                true, 'list', i >= minItems
              ));
            }
          } else if (newNode.items.length > templateArray.length) {
            for (let i = templateArray.length, l = newNode.items.length; i < l; i++) {
              templateArray.push(buildFormGroupTemplate(
                formSettings,
                schemaPointer + '/additionalItems',
                dataPointer + '/' + i,
                toControlPointer(formSettings.formGroupTemplate, dataPointer + '/' + i),
                false
              ));
            }
          }
          additionalItems = buildLayoutFromSchema(
            formSettings, -1,
            newNode.layoutPointer + '/items/-',
            schemaPointer + '/additionalItems',
            dataPointer + '/-',
            true, 'list', true
          );
        }
      } else {
        newNode.tupleItems = false;
        newNode.listItems = schema.maxItems || true;
        for (let i of Object.keys(templateArray).map(k => parseInt(k, 10))) {
          newNode.items.push(buildLayoutFromSchema(
            formSettings, i,
            newNode.layoutPointer + '/items/-',
            schemaPointer + '/items',
            dataPointer + '/' + i,
            true, 'list', i >= minItems
          ));
        }
        additionalItems = buildLayoutFromSchema(
          formSettings, -1,
          newNode.layoutPointer + '/items/-',
          schemaPointer + '/items',
          dataPointer + '/-',
          true, 'list', true
        );
      }

      // If addable items, save to layoutRefLibrary, and add $ref item to layout
      if (additionalItems) {
        formSettings.layoutRefLibrary[dataPointer + '/-'] = additionalItems;
        delete formSettings.layoutRefLibrary[dataPointer + '/-']['key'];
        delete formSettings.layoutRefLibrary[dataPointer + '/-']['name'];
        let buttonText: string = 'Add ';
        if (additionalItems.options.title) {
          buttonText += additionalItems.options.title;
        } else if (schema.title) {
          buttonText += 'to ' + schema.title;
        } else {
          buttonText += 'to ' +
            toTitleCase(JsonPointer.toKey(dataPointer).replace(/_/g, ' '));
        }
        newNode.items.push({
          'type': '$ref',
          'isArrayItem': true,
          'arrayItemType': 'list',
          'isRemovable': false,
          'layoutPointer': newNode.layoutPointer + '/items/-',
          '$ref': dataPointer + '/-',
          '$refType': 'array',
          'title': buttonText,
          'widget': formSettings.widgetLibrary.getWidget('$ref')
        });
      }
    break;
  }
  return newNode;
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
 * @param {any = ''} layoutPointer - the layoutPointer to layout, inside rootLayout
 * @return {[type]}
 */
export function mapLayout(
  layout: any[],
  fn: (v: any, i?: number, p?: string, l?: any) => any,
  layoutPointer: string = '',
  rootLayout: any[] = layout
): any[] {
  let indexPad: number = 0;
  let newLayout: any[] = [];
  forEach(layout, (item, index) => {
    let realIndex = +index + indexPad;
    let newPath = layoutPointer + '/' + realIndex;
    let newNode: any = copy(item);
    let itemsArray: any[] = [];
    if (isObject(item)) {
      if (hasOwn(item, 'items')) {
        itemsArray = isArray(item.items) ? item.items : [item.items];
      } else if (hasOwn(item, 'tabs')) {
        itemsArray = isArray(item.tabs) ? item.tabs : [item.tabs];
      }
    }
    if (itemsArray.length) {
      newNode.items = mapLayout(itemsArray, fn, newPath + '/items', rootLayout);
    }
    newNode = fn(newNode, realIndex, newPath, rootLayout);
    if (newNode === undefined) {
      indexPad--;
    } else {
      if (isArray(newNode)) indexPad += newNode.length - 1;
      newLayout = newLayout.concat(newNode);
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
 * @param {string | string[]} genericPointer - The generic pointer
 * @param {number[]} indexArray - The array of numeric indexes
 * @return {string} - The merged pointer with indexes
**/
export function toIndexedPointer(genericPointer: string, indexArray: number[]) {
  let indexedPointer = genericPointer;
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
 * @param {string | string[]} genericPointer - The generic pointer
 * @param {number[]} indexArray - The array of numeric indexes
 * @return {string} - The merged pointer with indexes
**/
export function toGenericPointer(
  genericPointer: string, arrayMap: Map<string, number>
) {
  let pointerArray = JsonPointer.parse(genericPointer);
  for (let i = 1, l = pointerArray.length; i < l; i++) {
    const subPointer = JsonPointer.compile(pointerArray.slice(0, i));
    if (arrayMap.has(subPointer) && arrayMap.get(subPointer) <= +pointerArray[i]) {
      pointerArray[i] = '-';
    }
  }
  return JsonPointer.compile(pointerArray);
};
