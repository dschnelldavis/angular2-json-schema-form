import {
  AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, NgForm,
  ValidatorFn, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import {
  forOwnDeep, getInputType, getControlValidators, hasOwn, inArray, isArray,
  isBlank, isEmpty, isInputRequired, isInteger, isNumber, isObject, isPresent,
  isPrimitive, isSet, isString, JsonPointer, JsonValidators, mapLayout,
  toJavaScriptType, toSchemaType, Pointer, SchemaPrimitiveType,
} from './index';

/**
 * FormGroup function library:
 *
 * buildFormGroupTemplate:  Builds a FormGroupTemplate from schema
 *
 * buildFormGroup:          Builds an Angular 2 FormGroup from a FormGroupTemplate
 *
 * setRequiredFields:
 *
 * formatFormData:
 *
 * getControl:
 *
 * ---- Under construction: ----
 * buildFormGroupTemplateFromLayout: Builds a FormGroupTemplate from a form layout
 */

/**
 * 'buildFormGroupTemplate' function
 *
 * Builds a template for an Angular 2 FormGroup from a JSON Schema.
 *
 * TODO: add support for pattern properties
 * https://spacetelescope.github.io/understanding-json-schema/reference/object.html
 *
 * @param {any} schema
 * @param {any} schemaRefLibrary
 * @param {any} fieldMap
 * @param {any = schema} rootSchema
 * @param {string = ''} dataPointer
 * @param {string = ''} schemaPointer
 * @return {any} - FormGroupTemplate
 */
export function buildFormGroupTemplate(
  schema: any, schemaRefLibrary: any, fieldMap: any,
  defaultValues: any = null, rootSchema: any = schema,
  dataPointer: string = '', schemaPointer: string = '', templatePointer: any = ''
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
  if (isEmpty(defaultValues) && schema.hasOwnProperty('default')) {
    defaultValues = schema.default;
  }
  let validators: any = getControlValidators(schema);
  switch (controlType) {
    case 'FormGroup':
      let groupControls: any = {};
      if (isEmpty(defaultValues) && schema.properties.hasOwnProperty('default')) {
        defaultValues = schema.properties.default;
      }
      _.forOwn(schema.properties, (item, key) => {
        if (key !== 'ui:order') {
          groupControls[key] = buildFormGroupTemplate(
            item, schemaRefLibrary, fieldMap,
            JsonPointer.get(defaultValues, '/' + key),
            rootSchema,
            dataPointer + '/' + key,
            schemaPointer + '/properties/' + key,
            templatePointer + '/controls/' + key
          );
        }
      });
      setRequiredFields(schema, groupControls);
      return { controlType, 'controls': groupControls, validators };
    case 'FormArray':
      let controls: any[];
      let minItems = schema.minItems || 0;
      let maxItems = schema.maxItems || 1000000;
      if (isArray(schema.items)) {
        controls = _.map(schema.items, (item, index) => {
          let itemTemplate = buildFormGroupTemplate(
            item, schemaRefLibrary, fieldMap,
            JsonPointer.get(defaultValues, '/' + index), rootSchema,
            dataPointer + '/' + index,
            schemaPointer + '/items/' + index,
            templatePointer + '/controls/' + index
          );
          if (index > minItems && index > maxItems) {
            schemaRefLibrary[dataPointer + '/' + index] = itemTemplate;
          }
          return itemTemplate;
        });
        if (schema.items.length < maxItems &&
          schema.hasOwnProperty('additionalItems') && isObject(schema.additionalItems)
        ) {
          controls.push(buildFormGroupTemplate(
            schema.additionalItems, schemaRefLibrary, fieldMap,
            JsonPointer.get(defaultValues, '/' + controls.length), rootSchema,
            dataPointer + '/' + controls.length,
            schemaPointer + '/additionalItems',
            templatePointer + '/controls/' + controls.length
          ));
          schemaRefLibrary[dataPointer + '/-'] = buildFormGroupTemplate(
            schema.additionalItems, schemaRefLibrary, fieldMap,
            null, rootSchema,
            dataPointer + '/-',
            schemaPointer + '/additionalItems',
            templatePointer + '/controls/-'
          );
        }
      } else {
        controls = [];
        if (isEmpty(defaultValues) && schema.items.hasOwnProperty('default')) {
          defaultValues = schema.items.default;
        }
        if (isArray(defaultValues) && defaultValues.length) {
          for (let i of Object.keys(defaultValues)) {
            let newTemplate = buildFormGroupTemplate(
              schema.items, schemaRefLibrary, fieldMap,
              defaultValues[i], rootSchema,
              dataPointer + '/' + i,
              schemaPointer + '/items',
              templatePointer + '/controls/' + i
            );
            controls.push(newTemplate);
          }
        }
        let initialItems = Math.max(
          minItems, (JsonPointer.has(schema, '/items/$ref') ? 0 : 1)
        );
        if (controls.length < initialItems) {
          for (let i = controls.length, l = Math.max(minItems, 1); i < l; i++) {
            controls.push(buildFormGroupTemplate(
              schema.items, schemaRefLibrary, fieldMap,
              null, rootSchema,
              dataPointer + '/' + i,
              schemaPointer + '/items',
              templatePointer + '/controls/' + i
            ));
          }
        }
        if (minItems !== maxItems) {
          schemaRefLibrary[dataPointer + '/-'] = buildFormGroupTemplate(
            schema.items, schemaRefLibrary, fieldMap,
            null, rootSchema,
            dataPointer + '/-',
            schemaPointer + '/items',
            templatePointer + '/controls/-'
          );
        }
      }
      return { controlType, controls, validators };
    case 'FormControl':
      let value: { value: any, disabled: boolean } = {
        value: (isPrimitive(defaultValues)) ? defaultValues : null,
        disabled: schema['disabled'] || schema['ui:disabled'] || false
      };
      return { controlType, value, validators };
    default:
      return null;
  }
}

// /**
//  * 'buildFormGroupTemplateFromLayout' function
//  *
//  * @param {any[]} layout
//  * @param {any} schemaRefLibrary
//  * @param {any} fieldMap
//  * @param {any = layout} rootLayout
//  * @param {string = ''} dataPointer
//  * @param {string = ''} layoutPointer
//  * @param {string = ''} templatePointer
//  * @return {any} - FormGroupTemplate
//  */
// export function buildFormGroupTemplateFromLayout(
//   layout: any[], schemaRefLibrary: any, fieldMap: any,
//   rootLayout: any = layout, dataPointer: string = '',
//   layoutPointer: string = '', templatePointer: string = '',
// ) {
//   let newModel: any = {};
//   _.forEach(layout, (value: any) => {
//     let thisKey: any = null;
//     if (value === '*') {
//       _.assign(newModel, JsonPointer.buildFormGroupTemplate(rootSchema, fieldMap));
//     } else if (_.isString(value)) {
//       thisKey = value;
//     } else if (hasOwn(value, 'key')) {
//       thisKey = value.key;
//     }
//     if (thisKey) {
//       if (thisKey.slice(-2) === '[]') {
//         _.set(newModel, thisKey.slice(0, -2), null);
//       } else {
//         _.set(newModel, thisKey, null);
//       }
//     } else if (hasOwn(value, 'items') && isArray(value.items)) {
//       newModel = Object.assign({}, newModel,
//         buildFormGroupTemplateFromLayout(value.items, fieldMap));
//     } else if (hasOwn(value, 'tabs') && isArray(value.tabs)) {
//       newModel = Object.assign({}, newModel,
//           buildFormGroupTemplateFromLayout(value.tabs, fieldMap));
//     }
//   });
//   return newModel;
// }

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
    if (validatorFns.length &&
      template.controlType === 'FormGroup' || template.controlType === 'FormArray'
    ) {
      validatorFn = validatorFns.length > 1 ?
        JsonValidators.compose(validatorFns) : validatorFns[0];
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
        return new FormArray(_.filter(_.map(template.controls,
          controls => buildFormGroup(controls)
        )), validatorFn);
      case 'FormControl':
        return new FormControl(template.value, validatorFns);
    }
  }
  return null;
}

/**
 * 'setRequiredFields' function
 *
 * @param {schema} schema - JSON Schema
 * @param {object} formControlTemplate - Form Control Template object
 * @return {boolean} - true if any fields have been set to required, false if not
 */
export function setRequiredFields(schema: any, formControlTemplate: any): boolean {
  let fieldsRequired = false;
  if (hasOwn(schema, 'required') && !_.isEmpty(schema.required)) {
    fieldsRequired = true;
    let requiredArray = isArray(schema.required) ? schema.required : [schema.required];
    _.forEach(requiredArray,
      key => JsonPointer.set(formControlTemplate, '/' + key + '/validators/required', [])
    );
  }
  return fieldsRequired;

  // TODO: Add support for patternProperties
  // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#pattern-properties
}

/**
 * 'formatFormData' function
 *
 * @param {any} formData - Angular 2 FormGroup data object
 * @param {any} fieldMap - map of correct data types for each field
 * @param {boolean = false} fixErrors - if TRUE, tries to fix data
 * @return {any} - formatted data object
 */
export function formatFormData(formData: any, fieldMap: any, fixErrors: boolean = false): any {
  let formattedData = {};
  forOwnDeep(formData, (value, key, ignore, pointer) => {
    let genericPointer: string;
    if (fieldMap.hasOwnProperty(pointer) && fieldMap[pointer].hasOwnProperty('schemaType')) {
      genericPointer = pointer;
    } else { // TODO: Fix to allow for integer object keys
      genericPointer = JsonPointer.compile(
        JsonPointer.parse(pointer).map(k => (isInteger(k)) ? '-' : k)
      );
    }
    if (fieldMap.hasOwnProperty(genericPointer) &&
      fieldMap[genericPointer].hasOwnProperty('schemaType')
    ) {
      let schemaType: SchemaPrimitiveType | SchemaPrimitiveType[] =
        fieldMap[genericPointer]['schemaType'];
      if (isSet(value) &&
        inArray(schemaType, ['string', 'integer', 'number', 'boolean', 'null'])
      ) {
        let newValue = fixErrors ? toSchemaType(value, schemaType) :
          toJavaScriptType(value, <SchemaPrimitiveType>schemaType);
        if (isPresent(newValue)) JsonPointer.set(formattedData, pointer, newValue);
      }
    }
  });
  return formattedData;
}

/**
 * 'getControl' function
 *
 * Uses a JSON Pointer for a data object to retrieve a control from
 * an Angular 2 FormGroup object.
 *
 * If the optional third parameter 'returnGroup' is set to TRUE, this function
 * returns the group containing the control, rather than the control itself.
 *
 * @param {FormGroup} formGroup - Angular 2 FormGroup to get value from
 * @param {Pointer} pointer - JSON Pointer (string or array)
 * @param {boolean = false} returnGroup - If true, return group containing control
 * @return {group} - Located value (or true or false, if returnError = true)
 */
export function getControl(
  formGroup: any, pointer: Pointer, returnGroup: boolean = false
): any {
  let subGroup = formGroup;
  let pointerArray: string[] = JsonPointer.parse(pointer);
  if (pointerArray === null) {
    console.error('Unable to get FormGroup - invalid JSON Pointer: ' + pointer);
    return null;
  }
  let l = pointerArray.length;
  if (returnGroup) l--;
  for (let i = 0; i < l; ++i) {
    let key = pointerArray[i];
    if (subGroup.hasOwnProperty('controls')) {
      subGroup = subGroup.controls;
    }
    if (isArray(subGroup) && (key === '-')) {
      subGroup = subGroup[subGroup.length - 1];
    } else if (subGroup.hasOwnProperty(key)) {
      subGroup = subGroup[key];
    } else {
      console.error('Unable to find "' + key + '" item in FormGroup.');
      console.error(pointer);
      console.error(formGroup);
      return null;
    }
  }
  return subGroup;
}
