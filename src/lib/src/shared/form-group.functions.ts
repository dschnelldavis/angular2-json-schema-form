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
import {
  combineAllOf, getControlValidators, getSubSchema, removeRecursiveReferences
} from './json-schema.functions';

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
 * ---- TODO: ----
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
) {
  // if (dataPointer !== '') {
  //   const shortDataPointer =
  //     removeRecursiveReferences(dataPointer, jsf.dataRecursiveRefMap, jsf.arrayMap);
  //   if (hasOwn(jsf.templateRefLibrary, shortDataPointer)) {
  //     const template = _.cloneDeep(jsf.templateRefLibrary[dataPointer]);
  //     if (setValues !== null) {
  //       // TODO: add values to template before returning
  //     }
  //     return template;
  //   }
  // }
  const schema = getSubSchema(
    jsf.schema, schemaPointer, jsf.schemaRefLibrary, jsf.schemaRecursiveRefMap
  );
  let useValues: any = jsf.globalOptions.setSchemaDefaults ?
    mergeValues(JsonPointer.get(schema, '/default'), setValues) : setValues;
  const schemaType: string | string[] = JsonPointer.get(schema, '/type');
  let controlType: 'FormGroup' | 'FormArray' | 'FormControl' | '$ref';
  controlType =
    (hasOwn(schema, 'properties') || hasOwn(schema, 'additionalProperties')) &&
      schemaType === 'object' ? 'FormGroup' :
    (hasOwn(schema, 'items') || hasOwn(schema, 'additionalItems')) &&
      schemaType === 'array' ? 'FormArray' :
    !schemaType && hasOwn(schema, '$ref') ? '$ref' : 'FormControl';
  if (dataPointer !== '' && !jsf.dataMap.has(dataPointer)) {
    jsf.dataMap.set(dataPointer, new Map());
    jsf.dataMap.get(dataPointer).set('schemaPointer', schemaPointer);
    jsf.dataMap.get(dataPointer).set('schemaType', schema.type);
    if (controlType) {
      jsf.dataMap.get(dataPointer).set('templatePointer', templatePointer);
      jsf.dataMap.get(dataPointer).set('templateType', controlType);
    }
    const genericDataPointer =
      JsonPointer.toGenericPointer(dataPointer, jsf.arrayMap);
    if (!jsf.dataMap.has(genericDataPointer)) {
      jsf.dataMap.set(genericDataPointer, new Map());
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
      if (propertyKeys.includes('*') &&
        !Object.keys(schema.properties).includes('*')
      ) {
        const unnamedKeys = Object.keys(schema.properties)
          .filter(key => !propertyKeys.includes(key));
        for (let i = propertyKeys.length - 1; i >= 0; i--) {
          if (propertyKeys[i] === '*') {
            propertyKeys.splice(i, 1, ...unnamedKeys);
          }
        }
      }
      propertyKeys = propertyKeys.filter(key =>
        Object.keys(schema.properties).includes(key) &&
        key.slice(0, 3).toLowerCase() !== 'ui:'
      );
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
      const maxItems = schema.maxItems || 1000;
      if (isArray(schema.items)) { // 'items' is an array = tuple items
        if (mapArrays && !jsf.arrayMap.get(dataPointer)) {
          jsf.arrayMap.set(dataPointer, schema.items.length);
        }
        controls = [];
        for (let i = 0, l = schema.items.length; i < l; i++) {
          if (i >= minItems && !hasOwn(jsf.templateRefLibrary, `${schemaPointer}/${i}`)) {
            const itemRefPointer = removeRecursiveReferences(
              dataPointer + '/' + i, jsf.dataRecursiveRefMap, jsf.arrayMap
            );
            if (!hasOwn(jsf.templateRefLibrary, itemRefPointer)) {
              jsf.templateRefLibrary[itemRefPointer] =
                buildFormGroupTemplate(
                  jsf, null, mapArrays,
                  schemaPointer + '/items/' + i,
                  dataPointer + '/' + i,
                  templatePointer + '/controls/' + i
                );
            }
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
        ) { // 'additionalItems' is an object = additional list items (after tuple items)
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
          if (!hasOwn(jsf.templateRefLibrary, `${schemaPointer}/additionalItems`)) {
            const itemRefPointer = removeRecursiveReferences(
              dataPointer + '/-', jsf.dataRecursiveRefMap, jsf.arrayMap
            );
            if (!hasOwn(jsf.templateRefLibrary, itemRefPointer)) {
              jsf.templateRefLibrary[itemRefPointer] =
                buildFormGroupTemplate(
                  jsf, null, mapArrays,
                  schemaPointer + '/additionalItems',
                  dataPointer + '/-',
                  templatePointer + '/controls/-'
                );
            }
          }
        }
      } else { // 'items' is an object = list items only (no tuple items)
        if (mapArrays && !jsf.arrayMap.get(dataPointer)) {
          jsf.arrayMap.set(dataPointer, 0);
        }
        if (
          !hasOwn(jsf.templateRefLibrary, `${schemaPointer}/items`)
          && templatePointer.length < 200
        ) {
          const itemRefPointer = removeRecursiveReferences(
            dataPointer + '/-', jsf.dataRecursiveRefMap, jsf.arrayMap
          );
          if (!hasOwn(jsf.templateRefLibrary, itemRefPointer)) {
            jsf.templateRefLibrary[itemRefPointer] =
              buildFormGroupTemplate(
                jsf, null, mapArrays,
                schemaPointer + '/items',
                dataPointer + '/-',
                templatePointer + '/controls/-'
              );
          }
        }
        controls = [];
        if (jsf.globalOptions.setSchemaDefaults) {
          useValues = mergeValues(
            JsonPointer.get(schema, '/items/default'), useValues
          );
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
      const schemaRef = JsonPointer.compile(schema.$ref);
      const dataRef = JsonPointer.toDataPointer(schemaRef, schema);
      const refPointer = removeRecursiveReferences(
        dataRef, jsf.dataRecursiveRefMap, jsf.arrayMap
      );
      if (refPointer && !hasOwn(jsf.templateRefLibrary, refPointer)) {
        // Set to null first to prevent recursive reference from causing endless loop
        jsf.templateRefLibrary[refPointer] = null;
        const newTemplate: any = buildFormGroupTemplate(jsf, null, false, schemaRef);
        if (newTemplate) {
          jsf.templateRefLibrary[refPointer] = newTemplate;
        } else {
          delete jsf.templateRefLibrary[refPointer];
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
  for (let currentValue of valuesToMerge) {
    if (!isEmpty(currentValue)) {
      if (typeof currentValue === 'object' &&
        (isEmpty(mergedValues) || typeof mergedValues !== 'object')
      ) {
        if (isArray(currentValue)) {
          mergedValues = [ ...currentValue ];
        } else if (isObject(currentValue)) {
          mergedValues = { ...currentValue };
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
          removeRecursiveReferences(dataPointer, recursiveRefMap, arrayMap);
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
        console.error(`formatFormData error: Schema type not found for form value at ${genericPointer}`);
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
 * @return {group} - Located value (or null, if no control found)
 */
export function getControl(
  formGroup: any, dataPointer: Pointer | string, returnGroup = false
): any {
  if (!isObject(formGroup) || !JsonPointer.isJsonPointer(dataPointer)) {
    if (!JsonPointer.isJsonPointer(dataPointer)) {
      // If dataPointer input is not a valid JSON pointer, check to
      // see if it is instead a valid object path, using dot notaion
      if (typeof dataPointer === 'string') {
        const formControl = formGroup.get(dataPointer);
        if (formControl) { return formControl; }
      }
      console.error(`getControl error: Invalid JSON Pointer: ${dataPointer}`);
    }
    if (!isObject(formGroup)) {
      console.error(`getControl error: Invalid formGroup: ${formGroup}`);
    }
    return null;
  }
  let dataPointerArray: string[] = JsonPointer.parse(dataPointer);
  if (returnGroup) {
    dataPointerArray = dataPointerArray.slice(0, -1);
  }

  // If formGroup input is a real formGroup (not a formGroup template)
  // try using formGroup.get() to return the control
  if (typeof formGroup.get === 'function' &&
    dataPointerArray.every(key => key.indexOf('.') === -1)
  ) {
    const formControl = formGroup.get(dataPointerArray.join('.'));
    if (formControl) { return formControl; }
  }

  // If formGroup input is a formGroup template,
  // or formGroup.get() failed to return the control,
  // search the formGroup object for dataPointer's control
  let subGroup = formGroup;
  for (let key of dataPointerArray) {
    if (hasOwn(subGroup, 'controls')) {
      subGroup = subGroup.controls;
    }
    if (isArray(subGroup) && (key === '-')) {
      subGroup = subGroup[subGroup.length - 1];
    } else if (hasOwn(subGroup, key)) {
      subGroup = subGroup[key];
    } else {
      console.error(`getControl error: Unable to find "${key}" item in FormGroup.`);
      console.error(dataPointer);
      console.error(formGroup);
      return;
    }
  }
  return subGroup;
}
