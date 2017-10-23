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
 * mergeValues:
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
 * @param  {any = null} initialValues -
 * @param  {boolean = true} mapArrays -
 * @param  {string = ''} schemaPointer -
 * @param  {string = ''} dataPointer -
 * @param  {any = ''} templatePointer -
 * @return {any} -
 */
export function buildFormGroupTemplate(
  jsf: any, initialValues: any = null, setValues: boolean = true,
  schemaPointer: string = '', dataPointer: string = '', templatePointer: any = ''
) {
  const schema = JsonPointer.get(jsf.schema, schemaPointer);
  let nodeValue = jsf.globalSettings.setSchemaDefaults ?
    mergeValues(JsonPointer.get(schema, '/default'), initialValues) : initialValues;
  const schemaType: string | string[] = JsonPointer.get(schema, '/type');
  let controlType: 'FormGroup' | 'FormArray' | 'FormControl' | '$ref';
  controlType =
    (hasOwn(schema, 'properties') || hasOwn(schema, 'additionalProperties')) &&
      schemaType === 'object' ? 'FormGroup' :
    (hasOwn(schema, 'items') || hasOwn(schema, 'additionalItems')) &&
      schemaType === 'array' ? 'FormArray' :
    !schemaType && hasOwn(schema, '$ref') ? '$ref' : 'FormControl';
  const shortDataPointer =
    removeRecursiveReferences(dataPointer, jsf.dataRecursiveRefMap, jsf.arrayMap);
  if (!jsf.dataMap.has(shortDataPointer)) {
    jsf.dataMap.set(shortDataPointer, new Map());
  }
  const nodeOptions = jsf.dataMap.get(shortDataPointer);
  if (!nodeOptions.has('schemaType')) {
    nodeOptions.set('schemaPointer', schemaPointer);
    nodeOptions.set('schemaType', schema.type);
    if (controlType) {
      nodeOptions.set('templatePointer', templatePointer);
      nodeOptions.set('templateType', controlType);
    }
  }
  let controls: any;
  let validators = getControlValidators(schema);
  switch (controlType) {

    case 'FormGroup':
      controls = {};
      if (hasOwn(schema, 'ui:order') || hasOwn(schema, 'properties')) {
        if (jsf.globalSettings.setSchemaDefaults) {
          nodeValue = mergeValues(JsonPointer.get(schema, '/properties/default'), nodeValue);
        }
        let propertyKeys = schema['ui:order'] || Object.keys(schema.properties);
        if (propertyKeys.includes('*') && !hasOwn(schema.properties, '*')) {
          const unnamedKeys = Object.keys(schema.properties)
            .filter(key => !propertyKeys.includes(key));
          for (let i = propertyKeys.length - 1; i >= 0; i--) {
            if (propertyKeys[i] === '*') {
              propertyKeys.splice(i, 1, ...unnamedKeys);
            }
          }
        }
        propertyKeys
          .filter(key => hasOwn(schema.properties, key) ||
            hasOwn(schema, 'additionalProperties')
          )
          .forEach(key => controls[key] = buildFormGroupTemplate(
            jsf, JsonPointer.get(nodeValue, [<string>key]), setValues,
            schemaPointer + (hasOwn(schema.properties, key) ?
              '/properties/' + key : '/additionalProperties'
            ),
            dataPointer + '/' + key,
            templatePointer + '/controls/' + key
          ));
        jsf.globalSettings.fieldsRequired = setRequiredFields(schema, controls);
      }
      return { controlType, controls, validators };

    case 'FormArray':
      controls = [];
      const minItems =
        Math.max(schema.minItems || 0, nodeOptions.get('minItems') || 0);
      const maxItems =
        Math.min(schema.maxItems || 1000, nodeOptions.get('maxItems') || 1000);
      let additionalItemsPointer: string = null;
      if (isArray(schema.items)) { // 'items' is an array = tuple items
        const tupleItems = nodeOptions.get('tupleItems') ||
          (isArray(schema.items) ? Math.min(schema.items.length, maxItems) : 0);
        for (let i = 0; i < tupleItems; i++) {
          if (i < minItems) {
            controls.push(buildFormGroupTemplate(
              jsf, isArray(nodeValue) ? nodeValue[i] : nodeValue, setValues,
              schemaPointer + '/items/' + i,
              dataPointer + '/' + i,
              templatePointer + '/controls/' + i
            ));
          } else {
            const schemaRefPointer = removeRecursiveReferences(
              schemaPointer + '/items/' + i, jsf.schemaRecursiveRefMap
            );
            const itemRefPointer = removeRecursiveReferences(
              shortDataPointer + '/' + i, jsf.dataRecursiveRefMap, jsf.arrayMap
            );
            const itemRecursive = itemRefPointer !== shortDataPointer + '/' + i;
            if (!hasOwn(jsf.templateRefLibrary, itemRefPointer)) {
              jsf.templateRefLibrary[itemRefPointer] = null;
              jsf.templateRefLibrary[itemRefPointer] = buildFormGroupTemplate(
                jsf, null, setValues,
                schemaRefPointer,
                itemRefPointer,
                templatePointer + '/controls/' + i
              );
            }
            controls.push(
              nodeValue !== null ?
                buildFormGroupTemplate(
                  jsf, isArray(nodeValue) ? nodeValue[i] : nodeValue, setValues,
                  schemaPointer + '/items/' + i,
                  dataPointer + '/' + i,
                  templatePointer + '/controls/' + i
                ) :
              itemRecursive ?
                null : _.cloneDeep(jsf.templateRefLibrary[itemRefPointer])
            );
          }
        }

        // If 'additionalItems' is an object = additional list items (after tuple items)
        if (schema.items.length < maxItems && isObject(schema.additionalItems)) {
          additionalItemsPointer = schemaPointer + '/additionalItems';
        }

      // If 'items' is an object = list items only (no tuple items)
      } else {
        additionalItemsPointer = schemaPointer + '/items';
      }

      if (additionalItemsPointer) {
        const schemaRefPointer = removeRecursiveReferences(
          additionalItemsPointer, jsf.schemaRecursiveRefMap
        );
        const itemRefPointer = removeRecursiveReferences(
          shortDataPointer + '/-', jsf.dataRecursiveRefMap, jsf.arrayMap
        );
        const itemRecursive = itemRefPointer !== shortDataPointer + '/-';
        if (!hasOwn(jsf.templateRefLibrary, itemRefPointer)) {
          jsf.templateRefLibrary[itemRefPointer] = null;
          jsf.templateRefLibrary[itemRefPointer] = buildFormGroupTemplate(
            jsf, null, setValues,
            schemaRefPointer,
            itemRefPointer,
            templatePointer + '/controls/-'
          );
        }
        // const itemOptions = jsf.dataMap.get(itemRefPointer) || new Map();
        const itemOptions = nodeOptions;
        if (jsf.globalSettings.setSchemaDefaults) {
          nodeValue =
            mergeValues(JsonPointer.get(schema, '/items/default'), nodeValue);
        }
        if (!itemRecursive || hasOwn(validators, 'required')) {
          const arrayLength = Math.min(Math.max(
            itemRecursive ? 0 :
              (itemOptions.get('tupleItems') + itemOptions.get('listItems')) || 0,
            isArray(nodeValue) ? nodeValue.length : 0
          ), maxItems);
          for (let i = controls.length; i < arrayLength; i++) {
            if (nodeValue !== null) {
              controls.push(buildFormGroupTemplate(
                jsf, isArray(nodeValue) ? nodeValue[i] : nodeValue, setValues,
                schemaRefPointer,
                dataPointer + '/-',
                templatePointer + '/controls/-'
              ));
            } else if (!itemRecursive) {
              controls.push(_.cloneDeep(jsf.templateRefLibrary[itemRefPointer]));
            }
          }
        }
        nodeValue = null;
      }
      return { controlType, controls, validators };

    case '$ref':
      const schemaRef = JsonPointer.compile(schema.$ref);
      const dataRef = JsonPointer.toDataPointer(schemaRef, schema);
      const refPointer = removeRecursiveReferences(
        dataRef, jsf.dataRecursiveRefMap, jsf.arrayMap
      );
      if (refPointer && !hasOwn(jsf.templateRefLibrary, refPointer)) {
        // Set to null first to prevent recursive reference from causing endless loop
        jsf.templateRefLibrary[refPointer] = null;
        const newTemplate = buildFormGroupTemplate(jsf, null, setValues, schemaRef);
        if (newTemplate) {
          jsf.templateRefLibrary[refPointer] = newTemplate;
        } else {
          delete jsf.templateRefLibrary[refPointer];
        }
      }
      return null;

    case 'FormControl':
      const value = {
        value: setValues && isPrimitive(nodeValue) ? nodeValue : null,
        disabled: nodeOptions.get('disabled') || false
      };
      return { controlType, value, validators };

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
        for (let i = 0; i < Math.max(mergedValues.length, currentValue.length); i++) {
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
  if (formData === null || typeof formData !== 'object') { return formData }
  let formattedData = isArray(formData) ? [] : {};
  JsonPointer.forEachDeep(formData, (value, dataPointer) => {
    if (typeof value !== 'object' || (value === null && returnEmptyFields)) {
      let genericPointer =
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
        console.error('formatFormData error: ' +
          `Schema type not found for form value at ${genericPointer}`);
        console.error('dataMap', dataMap);
        console.error('recursiveRefMap', recursiveRefMap);
        console.error('genericPointer', genericPointer);
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
  let dataPointerArray = JsonPointer.parse(dataPointer);
  if (returnGroup) { dataPointerArray = dataPointerArray.slice(0, -1); }

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
