import {
  AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, NgForm,
  ValidatorFn, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as _ from 'lodash';

import { hasOwn, isArray, isBlank } from './validator-functions';
import { JsonPointer } from './jsonpointer';
import { JsonValidators } from './json-validators';

/**
 * Form builder function library:
 *
 * buildFormGroupTemplate, buildFormGroup, getControlValidators, setRequiredFields
 */

/**
 * 'buildFormGroupTemplate' function
 *
 * Builds a template for an Angular 2 FormGroup from a JSON Schema.
 *
 * TODO: add support for pattern properties
 * https://spacetelescope.github.io/understanding-json-schema/reference/object.html
 *
 * @param {any} schema -
 * @param {any} formReferences -
 * @param {any} fieldMap -
 * @param {any = schema} rootSchema - Optional
 * @param {string = ''} dataPointer - Optional
 * @param {string = ''} schemaPointer - Optional
 * @param {string = ''} templatePointer - Optional
 * @return {any} - the FormGroup Template
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
 * @param {any} defaultValue -
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

/**
 * 'getControlValidators' function
 *
 * @param {schema} schema
 * @return {validators}
 */
export function getControlValidators(schema: any) {
  let validators: any = {};
  if (hasOwn(schema, 'type')) {
    switch (schema.type) {
      case 'string':
        _.forEach(['pattern', 'format', 'minLength', 'maxLength'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'number': case 'integer':
        _.forEach(['Minimum', 'Maximum'], (Limit) => {
          let eLimit = 'exclusive' + Limit;
          let limit = Limit.toLowerCase();
          if (hasOwn(schema, limit)) {
            let exclusive = hasOwn(schema, eLimit) && schema[eLimit] === true;
            validators[limit] = [schema[limit], exclusive];
          }
        });
        _.forEach(['multipleOf', 'type'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'object':
        _.forEach(['minProperties', 'maxProperties', 'dependencies'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
      case 'array':
        _.forEach(['minItems', 'maxItems', 'uniqueItems'], (prop) => {
          if (hasOwn(schema, prop)) validators[prop] = [schema[prop]];
        });
      break;
    }
  }
  if (hasOwn(schema, 'enum')) validators['enum'] = [schema['enum']];
  return validators;
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
