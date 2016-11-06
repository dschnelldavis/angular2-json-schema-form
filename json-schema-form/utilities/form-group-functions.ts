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
  isEmpty, isInteger, isObject, isDefined, isPrimitive, hasValue,
  isString, JsonPointer, JsonValidators, toGenericPointer, toJavaScriptType,
  toSchemaType, Pointer, SchemaPrimitiveType,
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
 * fixJsonFormOptions:
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
 * @param {any} formSettings
 * @param {string = ''} dataPointer
 * @param {string = ''} schemaPointer
 * @return {any} - FormGroupTemplate
 */
export function buildFormGroupTemplate(
  formSettings: any, schemaPointer: string = '', dataPointer: string = '',
  templatePointer: any = '', mapArrays: boolean = true, setValues: any = {}
): any {
  const schema: any = JsonPointer.get(formSettings.schema, schemaPointer);
  let useValues: any = {};
  if (setValues) {
    useValues = mergeValues(JsonPointer.get(schema, '/default'), setValues,
      JsonPointer.get(formSettings.defaultValues, dataPointer));
  }
  let controlType: 'FormGroup' | 'FormArray' | 'FormControl';
  if (JsonPointer.get(schema, '/type') === 'object' && hasOwn(schema, 'properties')) {
    controlType = 'FormGroup';
  } else if (JsonPointer.get(schema, '/type') === 'array' && hasOwn(schema, 'items')) {
    controlType = 'FormArray';
  } else {
    controlType = 'FormControl';
  }
  if (dataPointer !== '' && !formSettings.dataMap.has(dataPointer)) {
    formSettings.dataMap.set(dataPointer, new Map);
    formSettings.dataMap.get(dataPointer).set('schemaPointer', schemaPointer);
    formSettings.dataMap.get(dataPointer).set('schemaType', schema.type);
    if (controlType) {
      formSettings.dataMap.get(dataPointer).set('templatePointer', templatePointer);
      formSettings.dataMap.get(dataPointer).set('templateType', controlType);
    }
  }
  let controls: any;
  let validators: any = getControlValidators(schema);
  switch (controlType) {
    case 'FormGroup':
      controls = {};
      if (setValues) {
        useValues = mergeValues(JsonPointer.get(schema, '/properties/default'),
          useValues);
      }
      forEach(schema.properties, (item, key) => {
        if (key !== 'ui:order') {
          controls[key] = buildFormGroupTemplate(
            formSettings,
            schemaPointer + '/properties/' + key,
            dataPointer + '/' + key,
            templatePointer + '/controls/' + key,
            mapArrays, JsonPointer.get(useValues, [<string>key])
          );
        }
      });
      formSettings.globalOptions.fieldsRequired =
        setRequiredFields(schema, controls);
      return { controlType, controls, validators };
    case 'FormArray':
      const minItems = schema.minItems || 0;
      const maxItems = schema.maxItems || 1000000;
      if (isArray(schema.items)) { // 'items' is an array = tuple items
        if (mapArrays && !formSettings.arrayMap.get(dataPointer)) {
          formSettings.arrayMap.set(dataPointer, schema.items.length);
        }
        controls = [];
        for (let i = 0, l = schema.items.length; i < l; i++) {
          if (i >= minItems &&
            !JsonPointer.has(formSettings, ['templateRefLibrary', dataPointer + '/' + i])
          ) {
            formSettings.templateRefLibrary[dataPointer + '/' + i] =
              buildFormGroupTemplate(
                formSettings,
                schemaPointer + '/items/' + i,
                dataPointer + '/' + i,
                templatePointer + '/controls/' + i,
                mapArrays, false
              );
          }
          if (i < maxItems) {
            const useValue = isArray(useValues) ? useValues[i] : useValues;
            controls.push(buildFormGroupTemplate(
              formSettings,
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
              formSettings,
              schemaPointer + '/additionalItems',
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i,
              false, useValue
            ));
            if (isArray(useValues)) useValues = null;
          }
          if (!JsonPointer.has(formSettings, ['templateRefLibrary', dataPointer + '/-'])) {
            formSettings.templateRefLibrary[dataPointer + '/-'] =
              buildFormGroupTemplate(
                formSettings,
                schemaPointer + '/additionalItems',
                dataPointer + '/-',
                templatePointer + '/controls/-',
                mapArrays, false
              );
          }
        }
      } else { // 'items' is an object = list items only (no tuple items)
        if (mapArrays && !formSettings.arrayMap.get(dataPointer)) {
          formSettings.arrayMap.set(dataPointer, 0);
        }
        if (!JsonPointer.has(formSettings, ['templateRefLibrary', dataPointer + '/-'])) {
          formSettings.templateRefLibrary[dataPointer + '/-'] =
            buildFormGroupTemplate(
              formSettings,
              schemaPointer + '/items',
              dataPointer + '/-',
              templatePointer + '/controls/-',
              mapArrays, false
            );
        }
        controls = [];
        if (setValues) {
          useValues = mergeValues(JsonPointer.get(schema, '/items/default'),
            useValues);
        }
        if (isArray(useValues) && useValues.length) {
          for (let i of Object.keys(useValues)) {
            controls.push(buildFormGroupTemplate(
              formSettings,
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
            formSettings,
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
        value: setValues && isPrimitive(useValues) ? useValues : null,
        disabled: schema['disabled'] ||
          JsonPointer.get(schema, ['x-schema-form', 'disabled']) || false
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
//  * @param {any} formSettings
//  * @param {any = layout} rootLayout
//  * @param {string = ''} dataPointer
//  * @param {string = ''} layoutPointer
//  * @param {string = ''} templatePointer
//  * @return {any} - FormGroupTemplate
//  */
// export function buildFormGroupTemplateFromLayout(
//   layout: any[], formSettings: any,
//   rootLayout: any = layout, dataPointer: string = '',
//   layoutPointer: string = '', templatePointer: string = '',
// ) {
//   let newModel: any = {};
//   forEach(layout, (value: any) => {
//     let thisKey: any = null;
//     if (value === '*') {
//       _.assign(newModel, JsonPointer.buildFormGroupTemplate(rootSchema, formSettings));
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
//         buildFormGroupTemplateFromLayout(value.items, formSettings));
//     } else if (hasOwn(value, 'tabs') && isArray(value.tabs)) {
//       newModel = Object.assign({}, newModel,
//           buildFormGroupTemplateFromLayout(value.tabs, formSettings));
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
 * @param  {any[]} ...valuesToMerge - Multiple values to merge
 * @return {any} - Merged values
 */
export function mergeValues(...valuesToMerge) {
  let mergedValues: any = null;
  for (let index = 0, length = arguments.length; index < length; index++) {
    const currentValue = arguments[index];
    if (!isEmpty(currentValue)) {
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
  if (hasOwn(schema, 'required') && !isEmpty(schema.required)) {
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
 * @param {any} formSettings
 * @param {boolean = false} fixErrors - if TRUE, tries to fix data
 * @return {any} - formatted data object
 */
export function formatFormData(
  formData: any, formSettings: any, fixErrors: boolean = false
): any {
  let formattedData = {};
  JsonPointer.forEachDeep(formData, (value, dataPointer) => {
    if (typeof value !== 'object') {
      let genericPointer: string = dataPointer;
      if (!JsonPointer.has(formSettings.dataMap, [dataPointer, 'schemaType'])) {
        genericPointer = toGenericPointer(dataPointer, formSettings.arrayMap);
      }
      if (JsonPointer.has(formSettings.dataMap, [genericPointer, 'schemaType'])) {
        const schemaType: SchemaPrimitiveType | SchemaPrimitiveType[] =
          formSettings.dataMap.get(genericPointer).get('schemaType');
        if (schemaType === 'null') {
          JsonPointer.set(formattedData, dataPointer, null);
        } else if ( hasValue(value) &&
          inArray(schemaType, ['string', 'integer', 'number', 'boolean'])
        ) {
          const newValue = fixErrors ? toSchemaType(value, schemaType) :
            toJavaScriptType(value, <SchemaPrimitiveType>schemaType);
          if (isDefined(newValue)) {
            JsonPointer.set(formattedData, dataPointer, newValue);
          }
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

/**
 * 'fixJsonFormOptions' function
 *
 * Rename JSON Form 'options' lists to 'titleMap' lists
 *
 * @param  {any} formObject
 * @return {any}
 */
export function fixJsonFormOptions(formObject: any): any {
  if (isObject(formObject) || isArray(formObject)) {
    forEach(formObject, (value, key) => {
      if (isObject(value) && hasOwn(value, 'options') && isObject(value.options)) {
        value.titleMap = value.options;
        delete value.options;
      }
    }, 'top-down');
    // JsonPointer.forEachDeep(formObject, (value, pointer) => {
    //   if (isObject(value) && JsonPointer.toKey(pointer) === 'options') {
    //     JsonPointer.set(formObject, pointer.slice(0, -7) + 'titleMap', value);
    //     JsonPointer.remove(formObject, pointer);
    //   }
    // });
  }
  return formObject;
}
