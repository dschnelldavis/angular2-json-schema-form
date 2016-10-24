import {
  AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, NgForm,
  ValidatorFn, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import { JsonPointer } from './jsonpointer';
import { JsonValidators } from './json-validators';
import {
  getInputType, getControlValidators, isInputRequired,
  mapLayout, setRequiredFields, updateInputOptions
} from './utility-functions';
import {
  hasOwn, inArray, isArray, isBlank, isEmpty, isFunction,
  isNumber, isObject, isPresent, isSet, isString
} from './validator-functions';

/**
 * Form builder function library:
 *
 * buildLayout, buildLayoutFromSchema, buildFormGroupTemplate, buildFormGroup
 */

/**
 * 'buildLayout' function
 *
 * @param {any[]} layout            [description]
 * @param {any} schema            [description]
 * @param {any} data              [description]
 * @param {any} formOptions       [description]
 * @param {any} fieldMap          [description]
 * @param {any} schemaRefLibrary  [description]
 * @param {any} layoutRefLibrary  [description]
 * @param {any} widgetLibrary     [description]
 * @param {any} formGroupTemplate [description]
 * @return {any[]}                   [description]
 */
export function buildLayout(
  layout: any[], schema: any, data: any, formOptions: any,
  fieldMap: any, schemaRefLibrary: any, layoutRefLibrary: any,
  widgetLibrary: any, formGroupTemplate: any
): any[] {
  let hasSubmitButton = formOptions.noSubmit;
  return mapLayout(layout, (layoutItem, index, ignore, layoutPointer) => {
    let newItem: any = {};
    if (formOptions.setSchemaDefaults) {
      Object.assign(newItem, _.cloneDeep(formOptions.formDefaults));
    }
    if (isObject(layoutItem)) {
      Object.assign(newItem, layoutItem);
    } else if (JsonPointer.isJsonPointer(layoutItem)) {
      newItem.pointer = layoutItem;
    } else if (isString(layoutItem)) {
      newItem.key = layoutItem;
    } else {
      console.error('Form layout element not recognized:');
      console.error(layoutItem);
      return null;
    }
    let itemSchema: any = null;
    let schemaDefaultValue: any = null;
    if (hasOwn(newItem, 'key') || hasOwn(newItem, 'pointer')) {
      if (newItem.key === '*' || newItem.pointer === '*') {
        return buildLayoutFromSchema(
          schema, data, formOptions, fieldMap, schemaRefLibrary,
          layoutRefLibrary, widgetLibrary, formGroupTemplate
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
        itemSchema = JsonPointer.getFromSchema(schema, newItem.pointer);
        // TODO: add schemaPointer to fieldMap
        // fieldMap[newItem.pointer]['schemaPointer'] = ;
      }
      if (itemSchema) {
        // newItem.schema = itemSchema;
        if (!hasOwn(newItem, 'type')) {
          newItem.type = getInputType(itemSchema);
        }
        if (!hasOwn(newItem, 'dataType')) {
          newItem.dataType = itemSchema.type;
        }
        updateInputOptions(newItem, itemSchema, data,
            formOptions.formDefaults, fieldMap, formGroupTemplate);
        if (newItem.type === 'checkboxes' && hasOwn(itemSchema, 'items')) {
          updateInputOptions(newItem, itemSchema.items, data,
              formOptions.formDefaults, fieldMap, formGroupTemplate);
        }
        if (!newItem.title && !isNumber(newItem.name)) {
          newItem.title = newItem.name.charAt(0).toUpperCase() + newItem.name.slice(1);
        }
        if (isInputRequired(schema, newItem.pointer)) {
          formOptions.fieldsRequired = true;
          newItem.required = true;
        }
        schemaDefaultValue = itemSchema.default;
      } else {
        // TODO: create item in FormGroup model from layout key
      }
      newItem.widget = widgetLibrary.getWidget(newItem.type);
      fieldMap[newItem.pointer]['inputType'] = newItem.type;
      fieldMap[newItem.pointer]['widget'] = newItem.widget;
      if (newItem.type === 'array' && hasOwn(newItem, 'items')) {
        let arrayPointer: string = newItem.pointer + '/-';
        if (!hasOwn(fieldMap, arrayPointer)) fieldMap[arrayPointer] = {};
        fieldMap[arrayPointer]['inputType'] = 'section';
        let arrayItemGroup = [];
        let length: number = arrayPointer.length;
        let itemPointer: string = newItem.pointer + '/0';
        for (let i = newItem.items.length - 1, l = 0; i >= l; i--) {
          let subItem = newItem.items[i];
          if (subItem.pointer.slice(0, length) === arrayPointer) {
            subItem.pointer = itemPointer + subItem.pointer.slice(length);
            arrayItemGroup.unshift(newItem.items.pop());
          }
        }
        if (arrayItemGroup.length) {
          let newItemFieldset: any = {
            'type': 'fieldset',
            'pointer': itemPointer,
            'items': arrayItemGroup,
            'widget': widgetLibrary.getWidget('fieldset')
          };
          newItem.items.push(newItemFieldset);
          let newItemRef: any = {
            'type': '$ref', '$ref': arrayPointer, '$refType': 'array'
          };
          if (hasOwn(newItem, 'add') && isString(newItem.add)) {
            newItemRef.title = newItem.add;
            delete newItem.add;
          };
          if (hasOwn(newItem, 'style') && hasOwn(newItem.style, 'add')) {
            newItemRef.style = newItem.style.add;
            delete newItem.style.add;
            if (isEmpty(newItem.style)) delete newItem.style;
          };
          newItem.items.push(newItemRef);
          layoutRefLibrary[arrayPointer] = {
            'layout': newItemFieldset, '$refType': 'array'
          };
        }
      }
    } else if (hasOwn(newItem, 'type')) {
      newItem.widget = widgetLibrary.getWidget(newItem.type);
    }
    return newItem;
  });
}

/**
 * 'buildLayoutFromSchema' function
 *
 * @param {any} schema            [description]
 * @param {any} data              [description]
 * @param {any} formOptions       [description]
 * @param {any} fieldMap          [description]
 * @param {any} schemaRefLibrary  [description]
 * @param {any} layoutRefLibrary  [description]
 * @param {any} widgetLibrary     [description]
 * @param {any} formGroupTemplate [description]
 * @param {number = 0} layoutIndex   [description]
 * @param {any = schema} masterSchema  [description]
 * @param {string = ''} layoutPointer [description]
 * @param {string = ''} schemaPointer [description]
 * @param {string = ''} dataPointer   [description]
 * @return {any}
 */
export function buildLayoutFromSchema(
  schema: any, data: any, formOptions: any, fieldMap: any,
  schemaRefLibrary: any, layoutRefLibrary: any, widgetLibrary: any,
  formGroupTemplate: any, layoutIndex: number = 0, masterSchema: any = schema,
  layoutPointer: string = '', schemaPointer: string = '', dataPointer: string = ''
): any {
  if (!hasOwn(schema, 'type') && !hasOwn(schema, 'x-schema-form')) return null;
  let newItem: any = {};
  if (formOptions.setSchemaDefaults) {
    Object.assign(newItem, _.cloneDeep(formOptions.formDefaults));
  }
  if (hasOwn(schema, 'x-schema-form')) {
    Object.assign(newItem, schema['x-schema-form']);
  }
  newItem.pointer = dataPointer;
  newItem.name = JsonPointer.toKey(newItem.pointer);
  newItem.type = getInputType(schema);
  newItem.dataType = schema.type;
  newItem.widget = widgetLibrary.getWidget(newItem.type);
  if (dataPointer !== '') {
    if (!hasOwn(fieldMap, newItem.pointer)) fieldMap[newItem.pointer] = {};
    fieldMap[newItem.pointer]['schemaPointer'] = schemaPointer;
    fieldMap[newItem.pointer]['inputType'] = newItem.type;
    fieldMap[newItem.pointer]['widget'] = newItem.widget;
  }
  updateInputOptions(newItem, schema, data,
      formOptions.formDefaults, fieldMap, formGroupTemplate);
  if (!newItem.title && !isNumber(newItem.name)) {
    newItem.title = newItem.name.charAt(0).toUpperCase() + newItem.name.slice(1);
  }
  switch (newItem.type) {
    case 'fieldset':
      let newFieldset: any[] = [];
      let index: number = dataPointer === '' ? layoutIndex : 0;
      let newKeys: string[];
      let subObject: string = 'properties';
      if (hasOwn(schema, 'properties')) {
        if (hasOwn(schema.properties, 'ui:order')) {
          newKeys = schema['properties']['ui:order'];
        } else {
          newKeys = Object.keys(schema['properties']);
        }
      } else if (hasOwn(schema, 'additionalProperties')) {
        subObject = 'additionalProperties';
        newKeys = Object.keys(schema['additionalProperties']);
      }
      for (let i = 0, l = newKeys.length; i < l; i++) {
        let key = newKeys[i];
        if (hasOwn(schema[subObject], key)) {
          let item = schema[subObject][key];
          let innerItem = buildLayoutFromSchema(
            item, data, formOptions, fieldMap,
            schemaRefLibrary, layoutRefLibrary, widgetLibrary,
            formGroupTemplate, index, masterSchema,
            layoutPointer + '/' + index,
            schemaPointer + '/properties/' + key,
            dataPointer + '/' + key
          );
          if (innerItem) {
            if (isInputRequired(schema, '/' + key)) {
              formOptions.fieldsRequired = true;
              innerItem.required = true;
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
      let additionalItems: any = null;
      if (isArray(schema.items)) {
        newItem.items = _.filter(_.map(schema.items, (item, index) =>
          buildLayoutFromSchema(
            item, data, formOptions, fieldMap,
            schemaRefLibrary, layoutRefLibrary, widgetLibrary,
            formGroupTemplate, index, masterSchema,
            layoutPointer + '/items/' + index,
            schemaPointer + '/items/' + index,
            dataPointer + '/' + index
          )
        ));
        if (hasOwn(schema, 'additionalItems') && schema.additionalItems !== false) {
          additionalItems = buildLayoutFromSchema(
            schema.additionalItems, data, formOptions, fieldMap,
            schemaRefLibrary, layoutRefLibrary, widgetLibrary,
            formGroupTemplate, newItem.length, masterSchema,
            layoutPointer + '/items/' + newItem.length,
            schemaPointer + '/items/' + newItem.length,
            dataPointer + '/' + newItem.length
          );
          if (additionalItems) newItem.items.push(additionalItems);
        }
      } else {
        additionalItems = buildLayoutFromSchema(
          schema.items, data, formOptions, fieldMap,
          schemaRefLibrary, layoutRefLibrary, widgetLibrary,
          formGroupTemplate, 0, masterSchema,
          layoutPointer + '/items/-',
          schemaPointer + '/items/-',
          dataPointer + '/-'
        );
        newItem.items = [additionalItems];
      }

      // If addable items, save to layoutRefLibrary to enable adding later
      if (additionalItems) {
        layoutRefLibrary[dataPointer + '/-'] = {
          'layout': additionalItems, '$refType': 'array'
        };
        delete layoutRefLibrary[dataPointer + '/-']['layout']['key'];
        delete layoutRefLibrary[dataPointer + '/-']['layout']['name'];

        // add $ref item to layout to create 'add' button
        newItem.items.push({
          'type': '$ref', '$ref': dataPointer + '/-', '$refType': 'array'
        });
      }
    break;
  }
  return newItem;
}

/**
 * 'buildFormGroupTemplate' function
 *
 * Builds a template for an Angular 2 FormGroup from a JSON Schema.
 *
 * TODO: add support for pattern properties
 * https://spacetelescope.github.io/understanding-json-schema/reference/object.html
 *
 * @param {any} schema         [description]
 * @param {any} formReferences [description]
 * @param {any} fieldMap       [description]
 * @param {any = schema} rootSchema      [description]
 * @param {string = ''} dataPointer     [description]
 * @param {string = ''} schemaPointer   [description]
 * @param {string = ''} templatePointer [description]
 * @return {any}
 */
export function buildFormGroupTemplate(
  schema: any, formReferences: any, fieldMap: any,
  rootSchema: any = schema, dataPointer: string = '',
  schemaPointer: string = '', templatePointer: string = ''
): any {
  let controlType: 'FormGroup' | 'FormArray' | 'FormControl';
  if (schema.type === 'object' && hasOwn(schema, 'properties')) {
    controlType = 'FormGroup';
  } else if (schema.type === 'array' && hasOwn(schema, 'items')) {
    controlType = 'FormArray';
  } else {
    controlType = 'FormControl';
  }
  if (dataPointer !== '') {
    if (!hasOwn(fieldMap, dataPointer)) fieldMap[dataPointer] = {};
    fieldMap[dataPointer]['schemaPointer'] = schemaPointer;
    fieldMap[dataPointer]['schemaType'] = schema.type;
    if (controlType) {
      fieldMap[dataPointer]['templatePointer'] = templatePointer;
      fieldMap[dataPointer]['templateType'] = controlType;
    }
  }
  let validators: any = getControlValidators(schema);
  switch (controlType) {
    case 'FormGroup':
      let groupControls: any = {};
      _.forOwn(schema.properties, (item, key) => {
        if (key !== 'ui:order') {
          groupControls[key] = buildFormGroupTemplate(
            item, formReferences, fieldMap, rootSchema,
            dataPointer + '/' + key,
            schemaPointer + '/properties/' + key,
            templatePointer + '/controls/' + key
          );
        }
      });
      setRequiredFields(schema, groupControls);
      return { controlType, 'controls': groupControls, validators };
    case 'FormArray':
      let arrayControls: any[];
      if (isArray(schema.items)) {
        arrayControls = _.map(schema.items,
          (item, index) => buildFormGroupTemplate(
            item, formReferences, fieldMap, rootSchema,
            dataPointer + '/' + index,
            schemaPointer + '/items/' + index,
            templatePointer + '/controls/' + index
          )
        );
      } else {
        arrayControls = [buildFormGroupTemplate(
          schema.items, formReferences, fieldMap, rootSchema,
          dataPointer + '/-',
          schemaPointer + '/items',
          templatePointer + '/controls/-'
        )];
      }
      return { controlType, 'controls': arrayControls, validators };
    case 'FormControl':
      let value: any = fieldMap[dataPointer]['value'];
      return { controlType, value, validators };
    default:
      return null;
  }
}

/**
 * 'buildFormGroup' function
 *
 * @param {any} template -
 * @param {any = null} defaultValue -
 * @return {AbstractControl}
*/
export function buildFormGroup(template: any, defaultValue: any = null): AbstractControl {
  let validatorFns: ValidatorFn[] = [];
  let validatorFn: ValidatorFn = null;
  if (hasOwn(template, 'validators')) {
    _.forOwn(template.validators, (parameters, validator) => {
      if (typeof JsonValidators[validator] === 'function') {
        validatorFns.push(JsonValidators[validator].apply(null, parameters));
      }
    });
    if (template.controlType === 'FormGroup' || template.controlType === 'FormArray') {
      if (validatorFns.length === 1) {
        validatorFn = validatorFns[0];
      } else if (validatorFns.length > 1) {
        validatorFn = JsonValidators.compose(validatorFns);
      }
    }
  }
  if (hasOwn(template, 'controlType')) {
    switch (template.controlType) {
      case 'FormGroup':
        let groupControls: {[key: string]: AbstractControl} = {};
        _.forOwn(template.controls, (controls, key) => {
          let newControl: AbstractControl = buildFormGroup(controls);
          if (newControl) groupControls[key] = newControl;
        });
        return new FormGroup(groupControls, validatorFn);
      case 'FormArray':
        if (hasOwn(template, 'value')) {
          if (isArray(template.value)) {
            let lastControl: any = null;
            if (template.controls.length < template.value.length) {
              lastControl = template.controls[template.controls.length - 1];
            }
            for (let i = 0, l = template.value.length; i < l; i++) {
              if (i < template.controls.length && isBlank(template.controls[i]['value'])) {
                template.controls[i]['value'] = template.value[i];
              } else if (i = template.controls.length) {
                template.controls.push(_.cloneDeep(lastControl));
                template.controls[i]['value'] = template.value[i];
              }
            }
          } else {
            for (let i = 0, l = template.controls.length; i < l; i++) {
              if (isBlank(template.controls[i]['value'])) {
                template.controls[i]['value'] = template.value;
              }
            }
          }
          delete template.value;
        }
        return new FormArray(_.filter(_.map(template.controls,
          controls => buildFormGroup(controls)
        )), validatorFn);
      case 'FormControl':
        return new FormControl(template.value, validatorFns);
    }
  }
  return null;
}
