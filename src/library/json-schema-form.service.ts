import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs/Subject';

import * as Ajv from 'ajv';
import * as _ from 'lodash';

import {
  buildFormGroup, buildFormGroupTemplate, buildLayout, buildSchemaFromData,
  buildSchemaFromLayout, convertJsonSchema3to4, fixJsonFormOptions,
  formatFormData, getControl, getSchemaReference, hasOwn, hasValue, isArray,
  isDefined, isObject, isString, JsonPointer, parseText
} from './utilities/index';

export type CheckboxItem = { name: string, value: any, checked?: boolean };

@Injectable()
export class JsonSchemaFormService {
  public JsonFormCompatibility: boolean = false;
  public ReactJsonSchemaFormCompatibility: boolean = false;
  public AngularSchemaFormCompatibility: boolean = false;
  public tpldata: any = {};

  private ajv: any = new Ajv({ allErrors: true }); // AJV: Another JSON Schema Validator
  private validateFormData: any = null; // Compiled AJV function to validate active form's schema

  public initialValues: any = {}; // The initial data model (e.g. previously submitted data)
  public schema: any = {}; // The internal JSON Schema
  public layout: any[] = []; // The internal Form layout
  public formGroupTemplate: any = {}; // The template used to create formGroup
  public formGroup: any = null; // The Angular 2 formGroup, which powers the reactive form
  public framework: any = null; // The active framework component

  public data: any = {}; // Form data, formatted with correct data types
  public validData: any = null; // Valid form data (or null)
  public isValid: boolean = null; // Is current form data valid?
  public validationErrors: any = null; // Any validation errors for current data
  private formValueSubscription: any = null; // Subscription to formGroup.valueChanges observable (for un- and re-subscribing)
  public dataChanges: Subject<any> = new Subject(); // Form data observable
  public isValidChanges: Subject<any> = new Subject(); // isValid observable
  public validationErrorChanges: Subject<any> = new Subject(); // validationErrors observable

  public arrayMap: Map<string, number> = new Map<string, number>(); // Maps arrays in data object and number of tuple values
  public dataMap: Map<string, any> = new Map<string, any>(); // Maps paths in data model to schema and formGroup paths
  public dataRecursiveRefMap: Map<string, string> = new Map<string, string>(); // Maps recursive reference points in data model
  public schemaRecursiveRefMap: Map<string, string> = new Map<string, string>(); // Maps recursive reference points in schema
  public layoutRefLibrary: any = {}; // Library of layout nodes for adding to form
  public schemaRefLibrary: any = {}; // Library of schemas for resolving schema $refs
  public templateRefLibrary: any = {}; // Library of formGroup templates for adding to form

  // Default global form options
  public globalOptionDefaults: any = {
    addSubmit: 'auto', // Add a submit button if layout does not have one?
      // for addSubmit: true = always, false = never, 'auto' = only if layout is undefined
    debug: false, // Show debugging output?
    fieldsRequired: false, // Are there any required fields in the form?
    framework: 'bootstrap-3', // The framework to load
    widgets: {}, // Any custom widgets to load
    loadExternalAssets: false, // Load external css and JavaScript for framework?
    pristine: { errors: true, success: true },
    supressPropertyTitles: false,
    setSchemaDefaults: true,
    validateOnRender: false,
    formDefaults: { // Default options for form controls
      addable: true, // Allow adding items to an array or $ref point?
      orderable: true, // Allow reordering items within an array?
      removable: true, // Allow removing items from an array or $ref point?
      allowExponents: false, // Allow exponent entry in number fields?
      enableErrorState: true, // Apply 'has-error' class when field fails validation?
      // disableErrorState: false, // Don't apply 'has-error' class when field fails validation?
      enableSuccessState: true, // Apply 'has-success' class when field validates?
      // disableSuccessState: false, // Don't apply 'has-success' class when field validates?
      feedback: false, // Show inline feedback icons?
      notitle: false, // Hide title?
      readonly: false, // Set control as read only?
    },
  };
  public globalOptions: any;

  constructor() {
    this.globalOptions = _.cloneDeep(this.globalOptionDefaults);
  }

  public getData() { return this.data; }
  public getSchema() { return this.schema; }
  public getLayout() { return this.layout; }

  public resetAllValues() {
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
    this.arrayMap = new Map<string, number>();
    this.dataMap = new Map<string, any>();
    this.dataRecursiveRefMap = new Map<string, string>();
    this.schemaRecursiveRefMap = new Map<string, string>();
    this.layoutRefLibrary = {};
    this.schemaRefLibrary = {};
    this.templateRefLibrary = {};
    this.globalOptions = _.cloneDeep(this.globalOptionDefaults);
  }

  public convertJsonSchema3to4() {
    this.schema = convertJsonSchema3to4(this.schema);
  }

  public fixJsonFormOptions(layout: any): any {
    return fixJsonFormOptions(layout);
  }

  public buildFormGroupTemplate(setValues: boolean = true) {
    this.formGroupTemplate =
      buildFormGroupTemplate(this, this.initialValues, setValues);
  }

  private validateData(newValue: any, updateSubscriptions: boolean = true): void {

    // Format raw form data to correct data types
    this.data = formatFormData(
      newValue, this.dataMap, this.dataRecursiveRefMap, this.arrayMap
    );
    this.isValid = this.validateFormData(this.data);
    this.validData = this.isValid ? this.data : null;
    this.validationErrors = this.validateFormData.errors;
    if (updateSubscriptions) {
      if (this.dataChanges.observers.length) {
        this.dataChanges.next(this.data);
      }
      if (this.isValidChanges.observers.length) {
        this.isValidChanges.next(this.isValid);
      }
      if (this.validationErrorChanges.observers.length) {
        this.validationErrorChanges.next(this.validationErrors);
      }
    }
  }

  public buildFormGroup() {
    this.formGroup = <FormGroup>buildFormGroup(this.formGroupTemplate);
    if (this.formGroup) {
      this.compileAjvSchema();
      this.validateData(this.formGroup.value, false);

      // Set up observables to emit data and validation info when form data changes
      if (this.formValueSubscription) { this.formValueSubscription.unsubscribe(); }
      this.formValueSubscription = this.formGroup.valueChanges.subscribe(
        formValue => this.validateData(formValue)
      );
    }
  }

  public buildLayout(widgetLibrary: any) {
    this.layout = buildLayout(this, widgetLibrary);
  }

  public setOptions(newOptions: any): void {
    if (typeof newOptions === 'object') {
      Object.assign(this.globalOptions, newOptions);
    }
    if (hasOwn(this.globalOptions.formDefaults, 'disableErrorState')) {
      this.globalOptions.formDefaults.enableErrorState =
        !this.globalOptions.formDefaults.disableErrorState;
      delete this.globalOptions.formDefaults.disableErrorState;
    }
    if (hasOwn(this.globalOptions.formDefaults, 'disableSuccessState')) {
      this.globalOptions.formDefaults.enableSuccessState =
        !this.globalOptions.formDefaults.disableSuccessState;
      delete this.globalOptions.formDefaults.disableSuccessState;
    }
  }

  public compileAjvSchema() {
    if (!this.validateFormData) {
      this.validateFormData = this.ajv.compile(this.schema);
    }
  }

  // Resolve all schema $ref links
  public resolveSchemaRefLinks() {

    // Search schema for $ref links
    JsonPointer.forEachDeep(this.schema, (value, pointer) => {
      if (hasOwn(value, '$ref') && isString(value['$ref'])) {
        const newReference: string = JsonPointer.compile(value['$ref']);
        const isRecursive: boolean = JsonPointer.isSubPointer(newReference, pointer);

        // Save new target schemas in schemaRefLibrary
        if (hasValue(newReference) && !hasOwn(this.schemaRefLibrary, newReference)) {
          this.schemaRefLibrary[newReference] = getSchemaReference(
            this.schema, newReference, this.schemaRefLibrary
          );
        }

        // Save link in schemaRecursiveRefMap
        if (!this.schemaRecursiveRefMap.has(pointer)) {
          this.schemaRecursiveRefMap.set(pointer, newReference);
        }

        // If a $ref link is not recursive,
        // remove link and replace with copy of target schema
        if (!isRecursive) {
          delete value['$ref'];
          const targetSchema: any = Object.assign(
            _.cloneDeep(this.schemaRefLibrary[newReference]), value
          );
          this.schema = JsonPointer.set(this.schema, pointer, targetSchema);

          // Save partial link in schemaRecursiveRefMap,
          // so it can be matched later if it is recursive
          this.schemaRecursiveRefMap.set(newReference, pointer);
        } else {

          // If a matching partial link exists, complete it
          const mappedReference: string = this.schemaRecursiveRefMap.get(newReference);
          if (this.schemaRecursiveRefMap.has(newReference) &&
            JsonPointer.isSubPointer(mappedReference, newReference)
          ) {
            this.schemaRecursiveRefMap.set(newReference, mappedReference);
          }
        }
      }
    }, true);

    // Add redirects for links to shared schemas (such as definitions)
    let addRedirects: Map<string, string> = new Map<string, string>();
    this.schemaRecursiveRefMap.forEach((toRef1, fromRef1) =>
      this.schemaRecursiveRefMap.forEach((toRef2, fromRef2) => {
        if (fromRef1 !== fromRef2 && fromRef1 !== toRef2 &&
          JsonPointer.isSubPointer(toRef2, fromRef1)
        ) {
          const newRef: string = fromRef2 + fromRef1.slice(toRef2.length);
          if (!this.schemaRecursiveRefMap.has(newRef)) {
            addRedirects.set(newRef, toRef1);
          }
        }
      })
    );
    addRedirects.forEach((toRef, fromRef) => this.schemaRecursiveRefMap.set(fromRef, toRef));

    // Fix recursive references pointing to shared schemas
    this.schemaRecursiveRefMap.forEach((toRef1, fromRef1) =>
      this.schemaRecursiveRefMap.forEach((toRef2, fromRef2) => {
        if (fromRef1 !== fromRef2 && toRef1 === toRef2 &&
          JsonPointer.isSubPointer(fromRef1, fromRef2)
        ) {
          this.schemaRecursiveRefMap.set(fromRef2, fromRef1);
        }
      })
    );

    // Remove unmatched (non-recursive) partial links
    this.schemaRecursiveRefMap.forEach((toRef, fromRef) => {
      if (!JsonPointer.isSubPointer(toRef, fromRef) &&
        !hasOwn(this.schemaRefLibrary, toRef)
      ) {
        this.schemaRecursiveRefMap.delete(fromRef);
      }
    });

    // // TODO: Create dataRecursiveRefMap from schemaRecursiveRefMap
    // this.schemaRecursiveRefMap.forEach((toRef, fromRef) => {
    //   this.dataRecursiveRefMap.set(
    //     JsonPointer.toDataPointer(fromRef, this.schema),
    //     JsonPointer.toDataPointer(toRef, this.schema)
    //   );
    // });
  }

  public buildSchemaFromData(data?: any, requireAllFields: boolean = false): any {
    if (data) { return buildSchemaFromData(data, requireAllFields); }
    this.schema = buildSchemaFromData(this.initialValues, requireAllFields);
  }

  public buildSchemaFromLayout(layout?: any): any {
    if (layout) { return buildSchemaFromLayout(layout); }
    this.schema = buildSchemaFromLayout(this.layout);
  }

  public setTpldata(newTpldata: any = {}): void {
    this.tpldata = newTpldata;
  }

  public parseText(
    text: string = '', value: any = {}, values: any = {}, key: number|string = null
  ): string {
    return parseText(text, value, values, key, this.tpldata);
  }

  public setTitle(
    parentCtx: any = {}, childNode: any = null, index: number = null
  ): string {
    const parentNode: any = parentCtx.layoutNode;
    let text: string;
    let childValue: any;
    let parentValues: any = this.getControlValue(parentCtx);
    const isArrayItem: boolean =
      parentNode.type.slice(-5) === 'array' && isArray(parentValues);
    if (isArrayItem && childNode.type !== '$ref') {
      text = JsonPointer.getFirst([
        [childNode, '/options/legend'],
        [childNode, '/options/title'],
        [childNode, '/title'],
        [parentNode, '/options/title'],
        [parentNode, '/options/legend'],
        [parentNode, '/title'],
      ]);
    } else {
      text = JsonPointer.getFirst([
        [childNode, '/title'],
        [childNode, '/options/title'],
        [childNode, '/options/legend'],
        [parentNode, '/title'],
        [parentNode, '/options/title'],
        [parentNode, '/options/legend']
      ]);
      if (childNode.type === '$ref') { text = '+ ' + text; }
    }
    if (!text) { return text; }
    childValue = isArrayItem ? parentValues[index] : parentValues;
    return this.parseText(text, childValue, parentValues, index);
  }

  public initializeControl(ctx: any): boolean {
    ctx.formControl = this.getControl(ctx);
    ctx.boundControl = !!ctx.formControl;
    if (ctx.boundControl) {
      ctx.controlName = this.getControlName(ctx);
      ctx.controlValue = ctx.formControl.value;
      ctx.formControl.valueChanges.subscribe(v => ctx.controlValue = v);
      ctx.controlDisabled = ctx.formControl.disabled;
      // TODO: subscribe to status changes
      // TODO: emit / display error messages
      // ctx.formControl.statusChanges.subscribe(v => ...);
    } else {
      ctx.controlName = ctx.layoutNode.name;
      ctx.controlValue = ctx.layoutNode.value;
      const dataPointer = this.getDataPointer(ctx);
      if (dataPointer) {
        console.error('warning: control "' + dataPointer +
          '" is not bound to the Angular 2 FormGroup.');
      }
    }
    return ctx.boundControl;
  }

  public updateValue(ctx: any, value): void {

    // Set value of current control
    ctx.controlValue = value;
    if (ctx.boundControl) {
      ctx.formControl.setValue(value);
      ctx.formControl.markAsDirty();
    }
    ctx.layoutNode.value = value;

    // Set values of any related controls in copyValueTo array
    if (isArray(ctx.options.copyValueTo)) {
      for (let item of ctx.options.copyValueTo) {
        let targetControl = getControl(this.formGroup, item);
        if (isObject(targetControl) && typeof targetControl.setValue === 'function') {
          targetControl.setValue(value);
          targetControl.markAsDirty();
        }
      }
    }
  }

  public updateArrayCheckboxList(ctx: any, checkboxList: CheckboxItem[]): void {
    let formArray = <FormArray>this.getControl(ctx);

    // Remove all existing items
    while (formArray.value.length) { formArray.removeAt(0); }

    // Re-add an item for each checked box
    for (let checkboxItem of checkboxList) {
      if (checkboxItem.checked) {
        let newFormControl = buildFormGroup(JsonPointer.get(
          this.templateRefLibrary, [ctx.layoutNode.dataPointer + '/-']
        ));
        newFormControl.setValue(checkboxItem.value);
        formArray.push(newFormControl);
      }
    }
    formArray.markAsDirty();
  }

  public getControl(ctx: any): AbstractControl {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer ||
      ctx.layoutNode.type === '$ref') { return null; }
    return getControl(this.formGroup, this.getDataPointer(ctx));
  }

  public getControlValue(ctx: any): AbstractControl {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer ||
      ctx.layoutNode.type === '$ref') { return null; }
    const control = getControl(this.formGroup, this.getDataPointer(ctx));
    return control ? control.value : null;
  }

  public getControlGroup(ctx: any): FormArray | FormGroup {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer) { return null; }
    return getControl(this.formGroup, this.getDataPointer(ctx), true);
  }

  public getControlName(ctx: any): string {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) { return null; }
    return JsonPointer.toKey(this.getDataPointer(ctx));
  }

  public getLayoutArray(ctx: any): any[] {
    return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -1);
  }

  public getParentNode(ctx: any): any[] {
    return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -2);
  }

  public getDataPointer(ctx: any): string {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) { return null; }
    return JsonPointer.toIndexedPointer(ctx.layoutNode.dataPointer, ctx.dataIndex, this.arrayMap);
  }

  public getLayoutPointer(ctx: any): string {
    if (!ctx.layoutNode || !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) { return null; }
    return JsonPointer.toIndexedPointer(ctx.layoutNode.layoutPointer, ctx.layoutIndex);
  }

  public isControlBound(ctx: any): boolean {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) { return false; }
    const controlGroup = this.getControlGroup(ctx);
    const name = this.getControlName(ctx);
    return controlGroup ? controlGroup.controls.hasOwnProperty(name) : false;
  }

  public addItem(ctx: any): boolean {
    if (!ctx.layoutNode || !ctx.layoutNode.$ref || !ctx.dataIndex ||
      !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) { return false; }

    // Create a new Angular 2 form control from a template in templateRefLibrary
    const newFormGroup = buildFormGroup(JsonPointer.get(
      this.templateRefLibrary, [ctx.layoutNode.$ref]
    ));

    // Add the new form control to the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) { // Add new array item to formArray
      (<FormArray>this.getControlGroup(ctx))
        .push(newFormGroup);
    } else { // Add new $ref item to formGroup
      (<FormGroup>this.getControlGroup(ctx))
        .addControl(this.getControlName(ctx), newFormGroup);
    }

    // Copy a new layoutNode from layoutRefLibrary
    const newLayoutNode = _.cloneDeep(JsonPointer.get(
      this.layoutRefLibrary, [ctx.layoutNode.$ref]
    ));

    JsonPointer.forEachDeep(newLayoutNode, (value, pointer) => {

      // Reset all _id's in newLayoutNode to unique values
      if (hasOwn(value, '_id')) { value._id = _.uniqueId(); }

      // If adding a recursive item, prefix current dataPointer
      // and layoutPointer to all pointers in new layoutNode
      if (!ctx.layoutNode.arrayItem || ctx.layoutNode.recursiveReference) {
        if (hasOwn(value, 'dataPointer')) {
          value.dataPointer = ctx.layoutNode.dataPointer + value.dataPointer;
        }
        if (hasOwn(value, 'layoutPointer')) {
          value.layoutPointer =
            ctx.layoutNode.layoutPointer.slice(0, -2) + value.layoutPointer;
        }
      }
    });

    // Add the new layoutNode to the layout
    JsonPointer.insert(this.layout, this.getLayoutPointer(ctx), newLayoutNode);
    return true;
  }

  public moveArrayItem(ctx: any, oldIndex: number, newIndex: number): boolean {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex ||
      !ctx.layoutNode.layoutPointer || !ctx.layoutIndex ||
      !isDefined(oldIndex) || !isDefined(newIndex)) { return false; }

    // Move item in the formArray
    let formArray = <FormArray>this.getControlGroup(ctx);
    formArray.controls.splice(newIndex, 0, // add to new index
      formArray.controls.splice(oldIndex, 1)[0] // remove from old index
    );
    formArray.updateValueAndValidity();
    (<any>formArray)._onCollectionChange();

    // Move layout item
    let layoutArray = this.getLayoutArray(ctx);
    layoutArray.splice(newIndex, 0, layoutArray.splice(oldIndex, 1)[0]);
    return true;
  }

  public removeItem(ctx: any): boolean {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex ||
      !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) { return false; }

    // Remove the Angular 2 form control from the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) { // Remove array item from formArray
      (<FormArray>this.getControlGroup(ctx))
        .removeAt(ctx.dataIndex[ctx.dataIndex.length - 1]);
    } else { // Remove $ref item from formGroup
      (<FormGroup>this.getControlGroup(ctx))
        .removeControl(this.getControlName(ctx));
    }

    // Remove layoutNode from layout
    let layoutPointer = this.getLayoutPointer(ctx);
    JsonPointer.remove(this.layout, layoutPointer);
    return true;
  }
}
