import {
  AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn
} from '@angular/forms';

import * as _ from 'lodash';

import {
  hasValue, inArray, isArray, isEmpty, isObject, isDefined, isPrimitive,
  toJavaScriptType, toSchemaType, SchemaPrimitiveType
} from './validator.functions';
import { forEach, hasOwn } from './utility.functions';
import { Pointer, JsonPointer } from './jsonpointer.functions';
import { JsonValidators } from './json.validators';
import { getControlValidators, resolveRecursiveReferences } from './json-schema.functions';

/**
 * FormGroup function library:
 *
 * buildFormGroupTemplate:  Builds a FormGroupTemplate from schema
 *
 * buildFormGroup:          Builds an Angular FormGroup from a FormGroupTemplate
 *
 * setRequiredFields:
 *
 * formatFormData:
 *
 * getControl:
 *
 * fixJsonFormOptions:
 *
 * ---- Coming soon: ----
 * TODO: add buildFormGroupTemplateFromLayout function
 * buildFormGroupTemplateFromLayout: Builds a FormGroupTemplate from a form layout
 */

/**
 * 'buildFormGroupTemplate' function
 *
 * Builds a template for an Angular FormGroup from a JSON Schema.
 *
 * TODO: add support for pattern properties
 * https://spacetelescope.github.io/understanding-json-schema/reference/object.html
 *
 * @param  {any} jsf -
 * @param  {any = null} setValues -
 * @param  {boolean = true} mapArrays -
 * @param  {string = ''} schemaPointer -
 * @param  {string = ''} dataPointer -
 * @param  {any = ''} templatePointer -
 * @return {any} -
 */
export function buildFormGroupTemplate(
  jsf: any, setValues: any = null, mapArrays: boolean = true,
  schemaPointer: string = '', dataPointer: string = '', templatePointer: any = ''
): any {
  const schema: any = JsonPointer.get(jsf.schema, schemaPointer);
  let useValues: any = jsf.globalOptions.setSchemaDefaults ?
    mergeValues(JsonPointer.get(schema, '/default'), setValues) : setValues;
  const schemaType: string | string[] = JsonPointer.get(schema, '/type');
  let controlType: 'FormGroup' | 'FormArray' | 'FormControl' | '$ref';
  if (schemaType === 'object' && hasOwn(schema, 'properties')) {
    controlType = 'FormGroup';
  } else if (schemaType === 'array' && hasOwn(schema, 'items')) {
    controlType = 'FormArray';
  } else if (!schemaType && hasOwn(schema, '$ref')) {
    controlType = '$ref';
  } else {
    controlType = 'FormControl';
  }
  if (dataPointer !== '' && !jsf.dataMap.has(dataPointer)) {
    jsf.dataMap.set(dataPointer, new Map);
    jsf.dataMap.get(dataPointer).set('schemaPointer', schemaPointer);
    jsf.dataMap.get(dataPointer).set('schemaType', schema.type);
    if (controlType) {
      jsf.dataMap.get(dataPointer).set('templatePointer', templatePointer);
      jsf.dataMap.get(dataPointer).set('templateType', controlType);
    }
    const genericDataPointer =
      JsonPointer.toGenericPointer(dataPointer, jsf.arrayMap);
    if (!jsf.dataMap.has(genericDataPointer)) {
      jsf.dataMap.set(genericDataPointer, new Map);
      jsf.dataMap.get(genericDataPointer).set('schemaPointer', schemaPointer);
      jsf.dataMap.get(genericDataPointer).set('schemaType', schema.type);
    }
  }
  let controls: any;
  let validators: any = getControlValidators(schema);
  switch (controlType) {
    case 'FormGroup':
      controls = {};
      if (jsf.globalOptions.setSchemaDefaults) {
        useValues = mergeValues(JsonPointer.get(schema, '/properties/default'), useValues);
      }
      let propertyKeys = schema['ui:order'] ||
        schema.properties['ui:order'] ||
        Object.keys(schema.properties);
      for (let key of propertyKeys) {
        controls[key] = buildFormGroupTemplate(
          jsf, JsonPointer.get(useValues, [<string>key]), mapArrays,
          schemaPointer + '/properties/' + key,
          dataPointer + '/' + key,
          templatePointer + '/controls/' + key
        );
      }
      jsf.globalOptions.fieldsRequired = setRequiredFields(schema, controls);
      return { controlType, controls, validators };
    case 'FormArray':
      const minItems = schema.minItems || 0;
      const maxItems = schema.maxItems || 1000000;
      if (isArray(schema.items)) { // 'items' is an array = tuple items
        if (mapArrays && !jsf.arrayMap.get(dataPointer)) {
          jsf.arrayMap.set(dataPointer, schema.items.length);
        }
        controls = [];
        for (let i = 0, l = schema.items.length; i < l; i++) {
          if (i >= minItems &&
            !JsonPointer.has(jsf.templateRefLibrary, [dataPointer + '/' + i])
          ) {
            jsf.templateRefLibrary[dataPointer + '/' + i] =
              buildFormGroupTemplate(
                jsf, null, mapArrays,
                schemaPointer + '/items/' + i,
                dataPointer + '/' + i,
                templatePointer + '/controls/' + i
              );
          }
          if (i < maxItems) {
            const useValue = isArray(useValues) ? useValues[i] : useValues;
            controls.push(buildFormGroupTemplate(
              jsf, useValue, false,
              schemaPointer + '/items/' + i,
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i
            ));
          }
        }
        if (schema.items.length < maxItems &&
          hasOwn(schema, 'additionalItems') && isObject(schema.additionalItems)
        ) { // 'additionalItems' is an object = additional list items
          const l = Math.max(
            schema.items.length + 1,
            isArray(useValues) ? useValues.length : 0
          );
          for (let i = schema.items.length; i < l; i++) {
            const useValue = isArray(useValues) ? useValues[i] : useValues;
            controls.push(buildFormGroupTemplate(
              jsf, useValue, false,
              schemaPointer + '/additionalItems',
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i
            ));
            if (isArray(useValues)) { useValues = null; }
          }
          if (
            !JsonPointer.has(jsf, ['templateRefLibrary', dataPointer + '/-'])
          ) {
            jsf.templateRefLibrary[dataPointer + '/-'] =
              buildFormGroupTemplate(
                jsf, null, mapArrays,
                schemaPointer + '/additionalItems',
                dataPointer + '/-',
                templatePointer + '/controls/-'
              );
          }
        }
      } else { // 'items' is an object = list items only (no tuple items)
        if (mapArrays && !jsf.arrayMap.get(dataPointer)) {
          jsf.arrayMap.set(dataPointer, 0);
        }
        if (
          !JsonPointer.has(jsf.templateRefLibrary, [dataPointer + '/-'])
        ) {
          jsf.templateRefLibrary[dataPointer + '/-'] =
            buildFormGroupTemplate(
              jsf, null, mapArrays,
              schemaPointer + '/items',
              dataPointer + '/-',
              templatePointer + '/controls/-'
            );
        }
        controls = [];
        if (jsf.globalOptions.setSchemaDefaults) {
          useValues = mergeValues(
            JsonPointer.get(schema, '/items/default'), useValues);
        }
        if (isArray(useValues) && useValues.length) {
          for (let i of Object.keys(useValues)) {
            controls.push(buildFormGroupTemplate(
              jsf, useValues[i], false,
              schemaPointer + '/items',
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i
            ));
          }
          useValues = null;
        }
      }
      let initialItemCount =
        Math.max(minItems, JsonPointer.has(schema, '/items/$ref') ? 0 : 1);
      if (controls.length < initialItemCount) {
        for (let i = controls.length, l = initialItemCount; i < l; i++) {
          controls.push(buildFormGroupTemplate(
            jsf, useValues, false,
            schemaPointer + '/items',
            dataPointer + '/' + i,
            templatePointer + '/controls/' + i
          ));
        }
      }
      return { controlType, controls, validators };
    case 'FormControl':
      let value: { value: any, disabled: boolean } = {
        value: isPrimitive(useValues) ? useValues : null,
        disabled: schema['disabled'] ||
          JsonPointer.get(schema, '/x-schema-form/disabled') || false
      };
      return { controlType, value, validators };
    case '$ref':
      const schemaRef: string = JsonPointer.compile(schema.$ref);
      if (!hasOwn(jsf.templateRefLibrary, schemaRef)) {

        // Set to null first to prevent recursive reference from causing endless loop
        jsf.templateRefLibrary[schemaRef] = null;
        const newTemplate: any = buildFormGroupTemplate(jsf, null, false, schemaRef);
        if (newTemplate) {
          jsf.templateRefLibrary[schemaRef] = newTemplate;
        } else {
          delete jsf.templateRefLibrary[schemaRef];
        }
      }
      return null;
    default:
      return null;
  }
}

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
      inArray(template.controlType, ['FormGroup', 'FormArray'])
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
          if (newControl) { groupControls[key] = newControl; }
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
  // https://spacetelescope.github.io/understanding-json-schema/reference/object.html
  //   #pattern-properties
}

/**
 * 'formatFormData' function
 *
 * @param {any} formData - Angular FormGroup data object
 * @param  {Map<string, any>} dataMap -
 * @param  {Map<string, string>} recursiveRefMap -
 * @param  {Map<string, number>} arrayMap -
 * @param {boolean = false} fixErrors - if TRUE, tries to fix data
 * @return {any} - formatted data object
 */
export function formatFormData(
  formData: any, dataMap: Map<string, any>,
  recursiveRefMap: Map<string, string>, arrayMap: Map<string, number>,
  returnEmptyFields: boolean = false, fixErrors: boolean = false
): any {
  let formattedData = {};
  JsonPointer.forEachDeep(formData, (value, dataPointer) => {
    if (typeof value !== 'object' || (value === null && returnEmptyFields)) {
      let genericPointer: string =
        JsonPointer.has(dataMap, [dataPointer, 'schemaType']) ?
          dataPointer :
          resolveRecursiveReferences(dataPointer, recursiveRefMap, arrayMap);
      if (JsonPointer.has(dataMap, [genericPointer, 'schemaType'])) {
        const schemaType: SchemaPrimitiveType | SchemaPrimitiveType[] =
          dataMap.get(genericPointer).get('schemaType');
        if (schemaType === 'null') {
          JsonPointer.set(formattedData, dataPointer, null);
        } else if ( (hasValue(value) || returnEmptyFields) &&
          inArray(schemaType, ['string', 'integer', 'number', 'boolean'])
        ) {
          const newValue = (fixErrors || (value === null && returnEmptyFields)) ?
            toSchemaType(value, schemaType) :
            toJavaScriptType(value, schemaType);
          if (isDefined(newValue) || returnEmptyFields) {
            JsonPointer.set(formattedData, dataPointer, newValue);
          }
        }
      } else {
        console.error(
          'formatFormData error: Schema type not found for form value at ' +
          genericPointer
        );
        console.error(formData);
        console.error(dataMap);
        console.error(recursiveRefMap);
        console.error(arrayMap);
      }
    }
  });
  return formattedData;
}

/**
 * 'getControl' function
 *
 * Uses a JSON Pointer for a data object to retrieve a control from
 * an Angular formGroup or formGroup template. (Note: though a formGroup
 * template is much simpler, its basic structure is idential to a formGroup).
 *
 * If the optional third parameter 'returnGroup' is set to TRUE, the group
 * containing the control is returned, rather than the control itself.
 *
 * @param {FormGroup} formGroup - Angular FormGroup to get value from
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
    let l = dataPointerArray.length - (returnGroup ? 1 : 0);
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
        console.error('getControl error: Unable to find "' + key +
          '" item in FormGroup.');
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
 * 'fixJsonFormOptions' function
 *
 * Rename JSON Form-style 'options' lists to
 * Angular Schema Form-style 'titleMap' lists.
 *
 * @param  {any} formObject
 * @return {any}
 */
export function fixJsonFormOptions(layout: any): any {
  if (isObject(layout) || isArray(layout)) {
    forEach(layout, (value, key) => {
      if (isObject(value) && hasOwn(value, 'options') && isObject(value.options)) {
        value.titleMap = value.options;
        delete value.options;
      }
    }, 'top-down');
  }
  return layout;
}
