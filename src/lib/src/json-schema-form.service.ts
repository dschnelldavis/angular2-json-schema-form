import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { filter } from 'rxjs/operators/filter';
import { Subject } from 'rxjs/Subject';

import * as Ajv from 'ajv';
import * as _ from 'lodash';

import {
  hasValue, isArray, isDefined, isEmpty, isObject, isString
} from './shared/validator.functions';
import {
  fixTitle, forEach, hasOwn, parseText, toTitleCase
} from './shared/utility.functions';
import { JsonPointer } from './shared/jsonpointer.functions';
import {
  buildSchemaFromData, buildSchemaFromLayout, removeRecursiveReferences,
  resolveSchemaReferences
} from './shared/json-schema.functions';
import {
  buildFormGroup, buildFormGroupTemplate, formatFormData, getControl
} from './shared/form-group.functions';
import { buildLayout, getLayoutNode } from './shared/layout.functions';

export interface TitleMapItem {
  name?: string, value?: any, checked?: boolean, group?: string, items?: TitleMapItem[]
};
export interface ErrorMessages {
  [control_name: string]: { message: string|Function, code: string }[]
};

@Injectable()
export class JsonSchemaFormService {
  JsonFormCompatibility: boolean = false;
  ReactJsonSchemaFormCompatibility: boolean = false;
  AngularSchemaFormCompatibility: boolean = false;
  tpldata: any = {};

  ajvOptions: any = { allErrors: true, jsonPointers: true, unknownFormats: 'ignore' };
  ajv: any = new Ajv(this.ajvOptions); // AJV: Another JSON Schema Validator
  validateFormData: any = null; // Compiled AJV function to validate active form's schema

  initialValues: any = {}; // The initial data model (e.g. previously submitted data)
  schema: any = {}; // The internal JSON Schema
  layout: any[] = []; // The internal Form layout
  formGroupTemplate: any = {}; // The template used to create formGroup
  formGroup: any = null; // The Angular formGroup, which powers the reactive form
  framework: any = null; // The active framework component

  data: any = {}; // Form data, formatted with correct data types
  validData: any = null; // Valid form data (or null)
  isValid: boolean = null; // Is current form data valid?
  ajvErrors: any = null; // Ajv errors for current data
  validationErrors: any = null; // Any validation errors for current data
  dataErrors: any = new Map(); //
  formValueSubscription: any = null; // Subscription to formGroup.valueChanges observable (for un- and re-subscribing)
  dataChanges: Subject<any> = new Subject(); // Form data observable
  isValidChanges: Subject<any> = new Subject(); // isValid observable
  validationErrorChanges: Subject<any> = new Subject(); // validationErrors observable

  arrayMap: Map<string, number> = new Map(); // Maps arrays in data object and number of tuple values
  dataMap: Map<string, any> = new Map(); // Maps paths in data model to schema and formGroup paths
  dataRecursiveRefMap: Map<string, string> = new Map(); // Maps recursive reference points in data model
  schemaRecursiveRefMap: Map<string, string> = new Map(); // Maps recursive reference points in schema
  schemaRefLibrary: any = {}; // Library of schemas for resolving schema $refs
  layoutRefLibrary: any = { '': null }; // Library of layout nodes for adding to form
  templateRefLibrary: any = {}; // Library of formGroup templates for adding to form
  hasRootReference: boolean = false; // Does the form include a recursive reference to itself?

  // Default global form options
  defaultGlobalSettings: any = {
    addSubmit: 'auto', // Add a submit button if layout does not have one?
      // for addSubmit: true = always, false = never,
      // 'auto' = only if layout is undefined (form is built from schema alone)
    debug: false, // Show debugging output?
    fieldsRequired: false, // (set automatically) Are there any required fields in the form?
    framework: 'material-design', // The framework to load
    widgets: {}, // Any custom widgets to load
    loadExternalAssets: false, // Load external css and JavaScript for framework?
    pristine: { errors: true, success: true },
    supressPropertyTitles: false,
    disableInvalidSubmit: true, // Disable submit if form invalid?
    setSchemaDefaults: 'auto', // Set fefault values from schema?
      // true = always set (unless overridden by layout default or initialValues)
      // false = never set
      // 'auto' = set in addable components, and everywhere if initialValues not set
    setLayoutDefaults: 'auto', // Set fefault values from layout?
      // true = always set (unless overridden by initialValues)
      // false = never set
      // 'auto' = set in addable components, and everywhere if initialValues not set
    validateOnRender: 'auto', // Validate fields immediately, before they are touched?
      // true = validate all fields immediately
      // false = only validate fields after they are touched by user
      // 'auto' = validate fields with values immediately, empty fields after they are touched
    defaultOptions: { // Default options for form controls
      listItems: 1, // Number of list items to initially add to arrays with no default value
      addable: true, // Allow adding items to an array or $ref point?
      orderable: true, // Allow reordering items within an array?
      removable: true, // Allow removing items from an array or $ref point?
      enableErrorState: true, // Apply 'has-error' class when field fails validation?
      // disableErrorState: false, // Don't apply 'has-error' class when field fails validation?
      enableSuccessState: true, // Apply 'has-success' class when field validates?
      // disableSuccessState: false, // Don't apply 'has-success' class when field validates?
      feedback: false, // Show inline feedback icons?
      feedbackOnRender: false, // Show errorMessage on Render?
      notitle: false, // Hide title?
      readonly: false, // Set control as read only?
      returnEmptyFields: true, // return values for fields that contain no data?
      errorMessages: { // Default error messages
        required: 'Required',
        minLength: 'Must be {{requiredLength}} characters or longer (current length: {{currentLength}})',
        maxLength: 'Must be {{requiredLength}} characters or shorter (current length: {{currentLength}})',
        pattern: 'Must match pattern: {{requiredPattern}}',
        format: function (error) {
          switch (error.requiredFormat) {
            case 'date-time':
              return 'Must be a date-time formatted like "2000-12-31" or "2000-03-14T01:59.265"'
            case 'email':
              return 'Must be an email address formatted like "name@example.com"'
            case 'hostname':
              return 'Must be a hostname formatted like "example.com"'
            case 'ipv4':
              return 'Must be an IPv4 address formatted like "127.0.0.1"'
            case 'ipv6':
              return 'Must be an IPv6 address formatted like "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"'
            case 'uri': case 'url':
              return 'Must be a url formatted like "http://www.example.com/page.html"'
            case 'color':
              return 'Must be a color formatted like "#FFFFFF"'
            default:
              return 'Must be a correctly formatted ' + error.requiredFormat
          }
        },
        minimum: function(error) {
          return error.exclusiveMinimum ?
            `Must be more than ${error.minimumValue}` :
            `Must be ${error.minimumValue} or more`;
        },
        maximum: function(error) {
          return error.exclusiveMaximum ?
            `Must be less than ${error.maximumValue}` :
            `Must be ${error.maximumValue} or less`;
        },
        multipleOf: 'Must be a multiple of {{multipleOf}}',
        minProperties: 'Must have {{requiredProperties}} or more items (current items: {{currentProperties}})',
        maxProperties: 'Must have {{requiredProperties}} or fewer items (current items: {{currentProperties}})',
        minItems: 'Must have {{requiredItems}} or more items (current items: {{currentItems}})',
        maxItems: 'Must have {{requiredItems}} or fewer items (current items: {{currentItems}})',
        uniqueItems: 'All items must be unique',
        // Note: Default error messages not set for 'type', 'enum', or 'dependencies'
      },
    },
  };
  globalSettings: any;

  getData() { return this.data; }

  getSchema() { return this.schema; }

  getLayout() { return this.layout; }

  resetAllValues() {
    this.JsonFormCompatibility = false;
    this.ReactJsonSchemaFormCompatibility = false;
    this.AngularSchemaFormCompatibility = false;
    this.tpldata = {};
    this.validateFormData = null;
    this.initialValues = {};
    this.schema = {};
    this.layout = [];
    this.formGroupTemplate = {};
    this.formGroup = null;
    this.framework = null;
    this.data = {};
    this.validData = null;
    this.isValid = null;
    this.validationErrors = null;
    this.arrayMap = new Map();
    this.dataMap = new Map();
    this.dataRecursiveRefMap = new Map();
    this.schemaRecursiveRefMap = new Map();
    this.layoutRefLibrary = {};
    this.schemaRefLibrary = {};
    this.templateRefLibrary = {};
    this.globalSettings = _.cloneDeep(this.defaultGlobalSettings);
  }

  buildFormGroupTemplate(initialValues: any = null, setValues: boolean = true) {
    this.formGroupTemplate = buildFormGroupTemplate(this, initialValues, setValues);

  }

  /**
   * 'buildRemoteError' function
   *
   * Example errors:
   * {
   *   last_name: [ {
   *     message: 'Last name must by start with capital letter.',
   *     code: 'capital_letter'
   *   } ],
   *   email: [ {
   *     message: 'Email must be from example.com domain.',
   *     code: 'special_domain'
   *   }, {
   *     message: 'Email must contain an @ symbol.',
   *     code: 'at_symbol'
   *   } ]
   * }
   * @param {ErrorMessages} errors
   */
  buildRemoteError(errors: ErrorMessages) {
    forEach(errors, (value, key) => {
      if (key in this.formGroup.controls) {
        for (const error of value) {
          const err = {};
          err[error['code']] = error['message'];
          this.formGroup.get(key).setErrors(err);
        }
      }
    });
  }

  validateData(newValue: any, updateSubscriptions: boolean = true): void {

    // Format raw form data to correct data types
    this.data = formatFormData(
      newValue, this.dataMap, this.dataRecursiveRefMap,
      this.arrayMap, this.globalSettings.returnEmptyFields
    );
    this.isValid = this.validateFormData(this.data);
    this.validData = this.isValid ? this.data : null;
    const compileErrors = errors => {
      const compiledErrors = {};
      (errors || []).forEach(error => {
        if (!compiledErrors[error.dataPath]) { compiledErrors[error.dataPath] = []; }
        compiledErrors[error.dataPath].push(error.message);
      });
      return compiledErrors;
    }
    this.ajvErrors = this.validateFormData.errors;
    this.validationErrors = compileErrors(this.validateFormData.errors);
    if (updateSubscriptions) {
      this.dataChanges.next(this.data);
      this.isValidChanges.next(this.isValid);
      this.validationErrorChanges.next(this.ajvErrors);
    }
  }

  buildFormGroup() {
    this.formGroup = <FormGroup>buildFormGroup(this.formGroupTemplate);
    if (this.formGroup) {
      this.compileAjvSchema();
      this.validateData(this.formGroup.value);

      // Set up observables to emit data and validation info when form data changes
      if (this.formValueSubscription) { this.formValueSubscription.unsubscribe(); }
      this.formValueSubscription = this.formGroup.valueChanges
        .subscribe(formValue => this.validateData(formValue));
    }
  }

  buildLayout(widgetLibrary: any) {
    this.layout = buildLayout(this, widgetLibrary);
  }

  setOptions(newOptions: any) {
    if (isObject(newOptions)) {
      const addOptions = { ...newOptions }
      if (isObject(addOptions.defaultOptions)) {
        Object.assign(this.globalSettings.defaultOptions, addOptions.defaultOptions);
        delete addOptions.defaultOptions;
      }
      Object.assign(this.globalSettings, addOptions);

      // convert disableErrorState / disableSuccessState to enable...State
      const globalDefaults = this.globalSettings.defaultOptions;
      ['ErrorState', 'SuccessState']
        .filter(suffix => hasOwn(globalDefaults, 'disable' + suffix))
        .forEach(suffix => {
          globalDefaults['enable' + suffix] = !globalDefaults['disable' + suffix];
          delete globalDefaults['disable' + suffix];
        });
    }
  }

  compileAjvSchema() {
    if (!this.validateFormData) {

      // if 'ui:order' exists in properties, move it to root before compiling with ajv
      if (Array.isArray(this.schema.properties['ui:order'])) {
        this.schema['ui:order'] = this.schema.properties['ui:order'];
        delete this.schema.properties['ui:order'];
      }
      this.ajv.removeSchema(this.schema);
      this.validateFormData = this.ajv.compile(this.schema);
    }
  }

  buildSchemaFromData(data?: any, requireAllFields: boolean = false): any {
    if (data) { return buildSchemaFromData(data, requireAllFields); }
    this.schema = buildSchemaFromData(this.initialValues, requireAllFields);
  }

  buildSchemaFromLayout(layout?: any): any {
    if (layout) { return buildSchemaFromLayout(layout); }
    this.schema = buildSchemaFromLayout(this.layout);
  }


  setTpldata(newTpldata: any = {}): void {
    this.tpldata = newTpldata;
  }

  parseText(
    text: string = '', value: any = {}, values: any = {}, key: number|string = null
  ): string {
    return parseText(text, value, values, key, this.tpldata);
  }

  setTitle(
    parentCtx: any = {}, childNode: any = null, index: number = null
  ): string {
    const parentNode: any = parentCtx.layoutNode;
    const parentValues: any = this.getFormControlValue(parentCtx);
    const isArrayItem: boolean =
      (parentNode.type || '').slice(-5) === 'array' && isArray(parentValues);
    const text = JsonPointer.getFirst(
      isArrayItem && childNode.type !== '$ref' ? [
        [childNode, '/options/legend'],
        [childNode, '/options/title'],
        [parentNode, '/options/title'],
        [parentNode, '/options/legend'],
      ] : [
        [childNode, '/options/title'],
        [childNode, '/options/legend'],
        [parentNode, '/options/title'],
        [parentNode, '/options/legend']
      ]
    );
    if (!text) { return text; }
    const childValue = isArrayItem ? parentValues[index] : parentValues;
    return this.parseText(text, childValue, parentValues, index);
  }

  initializeControl(ctx: any, bind: boolean = true): boolean {
    if (!isObject(ctx.options) || isEmpty(ctx.options)) {
      ctx.options = _.cloneDeep(this.globalSettings);
    }
    ctx.formControl = this.getFormControl(ctx);
    ctx.boundControl = bind && !!ctx.formControl;
    if (ctx.formControl) {
      ctx.controlName = this.getFormControlName(ctx);
      ctx.controlValue = ctx.formControl.value;
      ctx.controlDisabled = ctx.formControl.disabled;
      ctx.options.errorMessage = ctx.formControl.status === 'VALID' ? null :
        this.formatErrors(ctx.formControl.errors, ctx.options.errorMessages);
      ctx.options.showErrors = this.globalSettings.validateOnRender === true ||
        (this.globalSettings.validateOnRender === 'auto' && hasValue(ctx.controlValue));
      ctx.formControl.statusChanges.subscribe(status =>
        ctx.options.errorMessage = status === 'VALID' ? null :
          this.formatErrors(ctx.formControl.errors, ctx.options.errorMessages)
      );
      ctx.formControl.valueChanges.subscribe(value => {
        if (!_.isEqual(ctx.controlValue, value)) { ctx.controlValue = value }
      });
    } else {
      ctx.controlName = ctx.layoutNode.name;
      ctx.controlValue = ctx.layoutNode.value || null;
      const dataPointer = this.getDataPointer(ctx);
      if (bind && dataPointer) {
        console.error(`warning: control "${dataPointer}" is not bound to the Angular FormGroup.`);
      }
    }
    return ctx.boundControl;
  }

  formatErrors(errors: any, errorMessages: any = {}): string {
    if (isEmpty(errors)) { return null; }
    if (!isObject(errorMessages)) { errorMessages = {}; }
    const addSpaces = string => string[0].toUpperCase() + (string.slice(1) || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    const formatError = (error) => typeof error === 'object' ?
      Object.keys(error).map(key =>
        error[key] === true ? addSpaces(key) :
        error[key] === false ? 'Not ' + addSpaces(key) :
        addSpaces(key) + ': ' + formatError(error[key])
      ).join(', ') :
      addSpaces(error.toString());
    const messages = [];
    return Object.keys(errors)
      // Hide 'required' error, unless it is the only one
      .filter(errorKey => errorKey !== 'required' || Object.keys(errors).length === 1)
      .map(errorKey =>
        // If custom error message is a function, return result
        typeof errorMessages[errorKey] === 'function' ?
          errorMessages[errorKey](errors[errorKey]) :
        // If custom error message is a string, replace placeholders and return
        typeof errorMessages[errorKey] === 'string' ?
          // Does error message have any {{property}} placeholders?
          errorMessages[errorKey].indexOf('{{') === -1 ?
            errorMessages[errorKey] :
            // Replace {{property}} placeholders with values
            Object.keys(errors[errorKey])
              .reduce((errorMessage, errorProperty) => errorMessage.replace(
                new RegExp('{{' + errorProperty + '}}', 'g'),
                errors[errorKey][errorProperty]
              ), errorMessages[errorKey]) :
          // If no custom error message, return formatted error data instead
          addSpaces(errorKey) + ' Error: ' + formatError(errors[errorKey])
      ).join('<br>');
  }

  updateValue(ctx: any, value: any): void {

    // Set value of current control
    ctx.controlValue = value;
    if (ctx.boundControl) {
      ctx.formControl.setValue(value);
      ctx.formControl.markAsDirty();
    }
    ctx.layoutNode.value = value;

    // Set values of any related controls in copyValueTo array
    if (isArray(ctx.options.copyValueTo)) {
      for (const item of ctx.options.copyValueTo) {
        const targetControl = getControl(this.formGroup, item);
        if (isObject(targetControl) && typeof targetControl.setValue === 'function') {
          targetControl.setValue(value);
          targetControl.markAsDirty();
        }
      }
    }
  }

  updateArrayCheckboxList(ctx: any, checkboxList: TitleMapItem[]): void {
    const formArray = <FormArray>this.getFormControl(ctx);

    // Remove all existing items
    while (formArray.value.length) { formArray.removeAt(0); }

    // Re-add an item for each checked box
    const refPointer = removeRecursiveReferences(
      ctx.layoutNode.dataPointer + '/-', this.dataRecursiveRefMap, this.arrayMap
    );
    for (const checkboxItem of checkboxList) {
      if (checkboxItem.checked) {
        const newFormControl = buildFormGroup(this.templateRefLibrary[refPointer]);
        newFormControl.setValue(checkboxItem.value);
        formArray.push(newFormControl);
      }
    }
    formArray.markAsDirty();
  }

  getFormControl(ctx: any): AbstractControl {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      ctx.layoutNode.type === '$ref'
    ) { return null; }
    return getControl(this.formGroup, this.getDataPointer(ctx));
  }

  getFormControlValue(ctx: any): AbstractControl {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      ctx.layoutNode.type === '$ref'
    ) { return null; }
    const control = getControl(this.formGroup, this.getDataPointer(ctx));
    return control ? control.value : null;
  }

  getFormControlGroup(ctx: any): FormArray | FormGroup {
    if (!ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer)) { return null; }
    return getControl(this.formGroup, this.getDataPointer(ctx), true);
  }

  getFormControlName(ctx: any): string {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) || !hasValue(ctx.dataIndex)
    ) { return null; }
    return JsonPointer.toKey(this.getDataPointer(ctx));
  }

  getLayoutArray(ctx: any): any[] {
    return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -1);
  }

  getParentNode(ctx: any): any {
    return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -2);
  }

  getDataPointer(ctx: any): string {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) || !hasValue(ctx.dataIndex)
    ) { return null; }
    return JsonPointer.toIndexedPointer(
      ctx.layoutNode.dataPointer, ctx.dataIndex, this.arrayMap
    );
  }

  getLayoutPointer(ctx: any): string {
    if (!hasValue(ctx.layoutIndex)) { return null; }
    return '/' + ctx.layoutIndex.join('/items/');
  }

  isControlBound(ctx: any): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) || !hasValue(ctx.dataIndex)
    ) { return false; }
    const controlGroup = this.getFormControlGroup(ctx);
    const name = this.getFormControlName(ctx);
    return controlGroup ? hasOwn(controlGroup.controls, name) : false;
  }

  addItem(ctx: any, name?: string): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.$ref) ||
      !hasValue(ctx.dataIndex) || !hasValue(ctx.layoutIndex)
    ) { return false; }

    // Create a new Angular form control from a template in templateRefLibrary
    const newFormGroup = buildFormGroup(this.templateRefLibrary[ctx.layoutNode.$ref]);

    // Add the new form control to the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) { // Add new array item to formArray
      (<FormArray>this.getFormControlGroup(ctx)).push(newFormGroup);
    } else { // Add new $ref item to formGroup
      (<FormGroup>this.getFormControlGroup(ctx))
        .addControl(name || this.getFormControlName(ctx), newFormGroup);
    }

    // Copy a new layoutNode from layoutRefLibrary
    const newLayoutNode = getLayoutNode(ctx.layoutNode, this.layoutRefLibrary);
    newLayoutNode.arrayItem = ctx.layoutNode.arrayItem;
    if (ctx.layoutNode.arrayItemType) {
      newLayoutNode.arrayItemType = ctx.layoutNode.arrayItemType;
    } else {
      delete newLayoutNode.arrayItemType;
    }
    if (name) {
      newLayoutNode.name = name;
      newLayoutNode.dataPointer += '/' + JsonPointer.escape(name);
      newLayoutNode.options.title = fixTitle(name);
    }

    // Add the new layoutNode to the form layout
    JsonPointer.insert(this.layout, this.getLayoutPointer(ctx), newLayoutNode);

    return true;
  }

  moveArrayItem(ctx: any, oldIndex: number, newIndex: number): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex) || !hasValue(ctx.layoutIndex) ||
      !isDefined(oldIndex) || !isDefined(newIndex) || oldIndex === newIndex
    ) { return false; }

    // Move item in the formArray
    const formArray = <FormArray>this.getFormControlGroup(ctx);
    const arrayItem = formArray.at(oldIndex);
    formArray.removeAt(oldIndex);
    formArray.insert(newIndex, arrayItem);
    formArray.updateValueAndValidity();

    // Move layout item
    const layoutArray = this.getLayoutArray(ctx);
    layoutArray.splice(newIndex, 0, layoutArray.splice(oldIndex, 1)[0]);
    return true;
  }

  removeItem(ctx: any): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex) || !hasValue(ctx.layoutIndex)
    ) { return false; }

    // Remove the Angular form control from the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) { // Remove array item from formArray
      (<FormArray>this.getFormControlGroup(ctx))
        .removeAt(ctx.dataIndex[ctx.dataIndex.length - 1]);
    } else { // Remove $ref item from formGroup
      (<FormGroup>this.getFormControlGroup(ctx))
        .removeControl(this.getFormControlName(ctx));
    }

    // Remove layoutNode from layout
    JsonPointer.remove(this.layout, this.getLayoutPointer(ctx));
    return true;
  }
}
