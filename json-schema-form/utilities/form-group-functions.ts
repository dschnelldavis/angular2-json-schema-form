import {
  AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, NgForm,
  ValidatorFn, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';
import * as Immutable from 'immutable';

import {
  forEach, getControlValidators, hasOwn, inArray, isArray,
  isEmpty, isNotEmpty, isInteger, isObject, isPresent, isPrimitive, isSet,
  isString, JsonPointer, JsonValidators, toJavaScriptType, toSchemaType,
  Pointer, SchemaPrimitiveType,
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
 * @param {any} formOptions
 * @param {string = ''} dataPointer
 * @param {string = ''} schemaPointer
 * @return {any} - FormGroupTemplate
 */
export function buildFormGroupTemplate(
  formOptions: any, schemaPointer: string = '', dataPointer: string = '',
  templatePointer: any = '', mapArrays: boolean = true, setValues: any = {}
): any {
  const schema: any = JsonPointer.get(formOptions.schema, schemaPointer);
  let useValues: any = {};
  if (setValues) {
    useValues = mergeValues(
      JsonPointer.get(schema, '/default'),
      setValues,
      JsonPointer.get(formOptions.defaultValues, dataPointer)
    );
  }
  let controlType: 'FormGroup' | 'FormArray' | 'FormControl';
  if (JsonPointer.get(schema, '/type') === 'object' && hasOwn(schema, 'properties')) {
    controlType = 'FormGroup';
  } else if (JsonPointer.get(schema, '/type') === 'array' && hasOwn(schema, 'items')) {
    controlType = 'FormArray';
  } else {
    controlType = 'FormControl';
  }
  if (dataPointer !== '' && !hasOwn(formOptions.dataMap, dataPointer)) {
    formOptions.dataMap[dataPointer] = {};
    formOptions.dataMap[dataPointer]['schemaPointer'] = schemaPointer;
    formOptions.dataMap[dataPointer]['schemaType'] = schema.type;
    if (controlType) {
      formOptions.dataMap[dataPointer]['templatePointer'] = templatePointer;
      formOptions.dataMap[dataPointer]['templateType'] = controlType;
    }
  }
  let controls: any;
  let validators: any = getControlValidators(schema);
  switch (controlType) {
    case 'FormGroup':
      controls = {};
      if (setValues) {
        useValues = mergeValues(JsonPointer.get(schema, '/properties/default'), useValues);
      }
      forEach(schema.properties, (item, key) => {
        if (key !== 'ui:order') {
          controls[key] = buildFormGroupTemplate(
            formOptions,
            schemaPointer + '/properties/' + key,
            dataPointer + '/' + key,
            templatePointer + '/controls/' + key,
            mapArrays, JsonPointer.get(useValues, [<string>key])
          );
        }
      });
      setRequiredFields(schema, controls);
      return { controlType, controls, validators };
    case 'FormArray':
      const minItems = schema.minItems || 0;
      const maxItems = schema.maxItems || 1000000;
      if (isArray(schema.items)) { // 'items' is an array = tuple items
        if (mapArrays && !formOptions.arrayMap.get(dataPointer)) {
          formOptions.arrayMap.set(dataPointer, schema.items.length);
        }
        controls = [];
        for (let i = 0, l = schema.items.length; i < l; i++) {
          if (i >= minItems &&
            !JsonPointer.has(formOptions, ['templateRefLibrary', dataPointer + '/' + i])
          ) {
            formOptions.templateRefLibrary[dataPointer + '/' + i] =
              buildFormGroupTemplate(
                formOptions,
                schemaPointer + '/items/' + i,
                dataPointer + '/' + i,
                templatePointer + '/controls/' + i,
                mapArrays, false
              );
          }
          if (i < maxItems) {
            const useValue = isArray(useValues) ? useValues[i] : useValues;
            controls.push(buildFormGroupTemplate(
              formOptions,
              schemaPointer + '/items/' + i,
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i,
              false, useValue
            ));
          }
        }
        if (schema.items.length < maxItems &&
          schema.hasOwnProperty('additionalItems') &&
          isObject(schema.additionalItems)
        ) { // 'additionalItems' is an object = additional list items
          const l = Math.max(
            schema.items.length + 1,
            isArray(useValues) ? useValues.length : 0
          );
          for (let i = schema.items.length; i < l; i++) {
            const useValue = isArray(useValues) ? useValues[i] : useValues;
            controls.push(buildFormGroupTemplate(
              formOptions,
              schemaPointer + '/additionalItems',
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i,
              false, useValue
            ));
            if (isArray(useValues)) useValues = null;
          }
          if (!JsonPointer.has(formOptions, ['templateRefLibrary', dataPointer + '/-'])) {
            formOptions.templateRefLibrary[dataPointer + '/-'] =
              buildFormGroupTemplate(
                formOptions,
                schemaPointer + '/additionalItems',
                dataPointer + '/-',
                templatePointer + '/controls/-',
                mapArrays, false
              );
          }
        }
      } else { // 'items' is an object = list items only (no tuple items)
        if (mapArrays && !formOptions.arrayMap.get(dataPointer)) {
          formOptions.arrayMap.set(dataPointer, 0);
        }
        if (!JsonPointer.has(formOptions, ['templateRefLibrary', dataPointer + '/-'])) {
          formOptions.templateRefLibrary[dataPointer + '/-'] =
            buildFormGroupTemplate(
              formOptions,
              schemaPointer + '/items',
              dataPointer + '/-',
              templatePointer + '/controls/-',
              mapArrays, false
            );
        }
        controls = [];
        if (setValues) {
          useValues = mergeValues(JsonPointer.get(schema, '/items/default'), useValues);
        }
        if (isArray(useValues) && useValues.length) {
          for (let i of Object.keys(useValues)) {
            controls.push(buildFormGroupTemplate(
              formOptions,
              schemaPointer + '/items',
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i,
              false, useValues[i]
            ));
          }
          useValues = null;
        }
      }
      let initialItems =
        Math.max(minItems, JsonPointer.has(schema, '/items/$ref') ? 0 : 1);
      if (controls.length < initialItems) {
        for (let i = controls.length, l = initialItems; i < l; i++) {
          controls.push(buildFormGroupTemplate(
            formOptions,
            schemaPointer + '/items',
            dataPointer + '/' + i,
            templatePointer + '/controls/' + i,
            false, useValues
          ));
        }
      }
      return { controlType, controls, validators };
    case 'FormControl':
      let value: { value: any, disabled: boolean } = {
        value: (setValues && isPrimitive(useValues)) ? useValues : null,
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
//  * @param {any} formOptions
//  * @param {any = layout} rootLayout
//  * @param {string = ''} dataPointer
//  * @param {string = ''} layoutPointer
//  * @param {string = ''} templatePointer
//  * @return {any} - FormGroupTemplate
//  */
// export function buildFormGroupTemplateFromLayout(
//   layout: any[], formOptions: any,
//   rootLayout: any = layout, dataPointer: string = '',
//   layoutPointer: string = '', templatePointer: string = '',
// ) {
//   let newModel: any = {};
//   forEach(layout, (value: any) => {
//     let thisKey: any = null;
//     if (value === '*') {
//       _.assign(newModel, JsonPointer.buildFormGroupTemplate(rootSchema, formOptions));
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
//         buildFormGroupTemplateFromLayout(value.items, formOptions));
//     } else if (hasOwn(value, 'tabs') && isArray(value.tabs)) {
//       newModel = Object.assign({}, newModel,
//           buildFormGroupTemplateFromLayout(value.tabs, formOptions));
//     }
//   });
//   return newModel;
// }

/**
 * 'buildFormGroup' function
 *
 * @param {any} template -
 * @return {AbstractControl}
*/
export function buildFormGroup(template: any): AbstractControl {
  let validatorFns: ValidatorFn[] = [];
  let validatorFn: ValidatorFn = null;
  if (hasOwn(template, 'validators')) {
    forEach(template.validators, (parameters, validator) => {
      if (typeof JsonValidators[validator] === 'function') {
        validatorFns.push(JsonValidators[validator].apply(null, parameters));
      }
    });
    if (validatorFns.length &&
      inArray(['FormGroup', 'FormArray'], template.controlType)
    ) {
      validatorFn = validatorFns.length > 1 ?
        JsonValidators.compose(validatorFns) : validatorFns[0];
    }
  }
  if (hasOwn(template, 'controlType')) {
    switch (template.controlType) {
      case 'FormGroup':
        let groupControls: { [key: string]: AbstractControl } = {};
        forEach(template.controls, (controls, key) => {
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
 * 'mergeValues' function
 *
 * @param  {any[]} ...valuesToMerge
 * @return {any}
 */
export function mergeValues(...valuesToMerge) {
  let mergedValues: any = null;
  for (let ai = 0, al = arguments.length; ai < al; ai++) {
    const currentValue = arguments[ai];
    if (isNotEmpty(currentValue)) {
      if (typeof currentValue === 'object' &&
        (isEmpty(mergedValues) || typeof mergedValues !== 'object')
      ) {
        if (isArray(currentValue)) {
          mergedValues = [].concat(currentValue);
        } else if (isObject(currentValue)) {
          mergedValues = Object.assign({}, currentValue);
        }
      } else if (typeof currentValue !== 'object') {
        mergedValues = currentValue;
      } else if (isObject(mergedValues) && isObject(currentValue)) {
        Object.assign(mergedValues, currentValue);
      } else if (isObject(mergedValues) && isArray(currentValue)) {
        let newValues = [];
        for (let value of currentValue) {
          newValues.push(mergeValues(mergedValues, value));
        }
        mergedValues = newValues;
      } else if (isArray(mergedValues) && isObject(currentValue)) {
        let newValues = [];
        for (let value of mergedValues) {
          newValues.push(mergeValues(value, currentValue));
        }
        mergedValues = newValues;
      } else if (isArray(mergedValues) && isArray(currentValue)) {
        let newValues = [];
        const l = Math.max(mergedValues.length, currentValue.length);
        for (let i = 0; i < l; i++) {
          if (i < mergedValues.length && i < currentValue.length) {
            newValues.push(mergeValues(mergedValues[i], currentValue[i]));
          } else if (i < mergedValues.length) {
            newValues.push(mergedValues[i]);
          } else if (i < currentValue.length) {
            newValues.push(currentValue[i]);
          }
        }
        mergedValues = newValues;
      }
    }
  }
  return mergedValues;
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
  if (hasOwn(schema, 'required') && isNotEmpty(schema.required)) {
    fieldsRequired = true;
    let requiredArray = isArray(schema.required) ? schema.required : [schema.required];
    requiredArray = forEach(requiredArray,
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
 * @param {any} formOptions
 * @param {boolean = false} fixErrors - if TRUE, tries to fix data
 * @return {any} - formatted data object
 */
export function formatFormData(
  formData: any, formOptions: any, fixErrors: boolean = false
): any {
  let formattedData = {};
  JsonPointer.forEachDeep(formData, (value, pointer) => {
    if (typeof value !== 'object') {
      let genericPointer: string;
      if ( formOptions.dataMap.hasOwnProperty(pointer) &&
        formOptions.dataMap[pointer].hasOwnProperty('schemaType')
      ) {
        genericPointer = pointer;
      } else { // TODO: Fix to allow for integer object keys and tuple arrays
        genericPointer = JsonPointer.compile(
          JsonPointer.parse(pointer).map(k => (isInteger(k)) ? '-' : k)
        );
      }
      if ( formOptions.dataMap.hasOwnProperty(genericPointer) &&
        formOptions.dataMap[genericPointer].hasOwnProperty('schemaType')
      ) {
        const schemaType: SchemaPrimitiveType | SchemaPrimitiveType[] =
          formOptions.dataMap[genericPointer]['schemaType'];
        if (schemaType === 'null') {
          JsonPointer.set(formattedData, pointer, null);
        } else if ( isSet(value) &&
          inArray(schemaType, ['string', 'integer', 'number', 'boolean'])
        ) {
          const newValue = fixErrors ? toSchemaType(value, schemaType) :
            toJavaScriptType(value, <SchemaPrimitiveType>schemaType);
          if (isPresent(newValue)) JsonPointer.set(formattedData, pointer, newValue);
        }
      } else {
        console.error('formatFormData error: Schema type not found ' +
          'for form value at "' + genericPointer + '".');
      }
    }
  });
  return formattedData;
}

/**
 * 'getControl' function
 *
 * Uses a JSON Pointer for a data object to retrieve a control from
 * an Angular 2 FormGroup.
 *
 * If the optional third parameter 'returnGroup' is set to TRUE, the group
 * containing the control is returned, rather than the control itself.
 *
 * @param {FormGroup} formGroup - Angular 2 FormGroup to get value from
 * @param {Pointer} dataPointer - JSON Pointer (string or array)
 * @param {boolean = false} returnGroup - If true, return group containing control
 * @return {group} - Located value (or true or false, if returnError = true)
 */
export function getControl(
  formGroup: any, dataPointer: Pointer, returnGroup: boolean = false
): any {
  const dataPointerArray: string[] = JsonPointer.parse(dataPointer);
  let subGroup = formGroup;
  if (dataPointerArray !== null) {
    let l = returnGroup ? dataPointerArray.length - 1 : dataPointerArray.length;
    for (let i = 0; i < l; ++i) {
      let key = dataPointerArray[i];
      if (subGroup.hasOwnProperty('controls')) {
        subGroup = subGroup.controls;
      }
      if (isArray(subGroup) && (key === '-')) {
        subGroup = subGroup[subGroup.length - 1];
      } else if (subGroup.hasOwnProperty(key)) {
        subGroup = subGroup[key];
      } else {
        console.error('getControl error: Unable to find "' + key + '" item in FormGroup.');
        console.error(dataPointer);
        console.error(formGroup);
        return;
      }
    }
    return subGroup;
  }
  console.error('getControl error: Invalid JSON Pointer: ' + dataPointer);
}

/**
 * 'toControlPointer' function
 *
 * Accepts a JSON Pointer for a data object and returns a JSON Pointer for the
 * matching control in an Angular 2 FormGroup.
 *
 * If the optional third parameter 'returnGroup' is set to TRUE, the group
 * containing the control is returned, rather than the control itself.
 *
 * @param {FormGroup} formGroup - Angular 2 FormGroup to get value from
 * @param {Pointer} dataPointer - JSON Pointer (string or array)
 * @param {boolean = false} returnGroup - If true, return group containing control
 * @return {group} - Located value (or true or false, if returnError = true)
 */
export function toControlPointer(formGroup: any, dataPointer: Pointer): any {
  const dataPointerArray: string[] = JsonPointer.parse(dataPointer);
  let controlPointerArray: string[] = [];
  let subGroup = formGroup;
  if (dataPointerArray !== null) {
    for (let key of dataPointerArray) {
      if (subGroup.hasOwnProperty('controls')) {
        controlPointerArray.push('controls');
        subGroup = subGroup.controls;
      }
      if (isArray(subGroup) && (key === '-')) {
        controlPointerArray.push((subGroup.length - 1).toString());
        subGroup = subGroup[subGroup.length - 1];
      } else if (subGroup.hasOwnProperty(key)) {
        controlPointerArray.push(key);
        subGroup = subGroup[key];
      } else {
        console.error('toControlPointer error: Unable to find "' + key + '" item in FormGroup.');
        console.error(dataPointer);
        console.error(formGroup);
        return;
      }
    }
    return JsonPointer.compile(controlPointerArray);
  }
  console.error('getControl error: Invalid JSON Pointer: ' + dataPointer);
}
