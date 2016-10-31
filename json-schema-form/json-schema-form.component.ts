import {
  Component, ComponentFactoryResolver, ComponentRef, DoCheck, EventEmitter,
  Input, Output, OnChanges, OnInit, AfterContentInit, AfterViewInit,
  ViewChild, ViewContainerRef
} from '@angular/core';
import {
  AbstractControl, FormArray, FormControl, FormGroup, FormBuilder, NgForm,
  ValidatorFn, Validators
} from '@angular/forms';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import * as Ajv from 'ajv';
import * as _ from 'lodash';

import { FrameworkLibraryService } from './frameworks/framework-library.service';
import { WidgetLibraryService } from './widgets/widget-library.service';
import {
  buildFormGroup, buildFormGroupTemplate, buildLayout, convertJsonSchema3to4,
  formatFormData, getSchemaReference, hasOwn, isArray, isEmpty, isObject,
  isString, JsonPointer
} from './utilities/index';

/**
 * @module 'JsonSchemaFormComponent' - Angular 2 JSON Schema Form
 *
 * Root module of the Angular 2 JSON Schema Form client-side library,
 * an Angular 2 library which generates an HTML form from a JSON schema
 * structured data model and/or a JSON Schema Form layout description.
 *
 * This library also validates inputs data by the user, both using individual
 * validators which provide real-time feedback while the user is filling out
 * the form, and then using the entire schema when the form is submitted,
 * to make sure the returned JSON data object is valid.
 *
 * This library is similar to, and mostly API compatible with:
 *
 * - Joshfire's JSON Form library for jQuery
 *   https://github.com/joshfire/jsonform
 *   http://ulion.github.io/jsonform/playground (examples)
 *
 * - JSON Schema Form's Angular Schema Form library for AngularJs
 *   http://schemaform.io
 *   http://schemaform.io/examples/bootstrap-example.html (examples)
 *
 * - Mozilla's react-jsonschema-form library for React
 *   https://github.com/mozilla-services/react-jsonschema-form
 *   https://mozilla-services.github.io/react-jsonschema-form (examples)
 *
 * This library depends on:
 *  - lodash, JavaScript utility library   https://github.com/lodash/lodash
 *  - ajv, Another JSON Schema validator   https://github.com/epoberezkin/ajv
 */
@Component({
  moduleId: module.id,
  selector: 'json-schema-form',
  template: `<form (ngSubmit)="submitForm()">
    <root-widget *ngIf="formActive"
      [layoutNode]="masterLayout"
      [formGroup]="masterFormGroup"
      [formOptions]="formOptions"
      [isFirstRoot]="true"
      [debug]="debug">
    </root-widget>
  </form>
  <div *ngIf="debug">Debug output: <pre>{{debugOutput}}</pre></div>`,
})
export class JsonSchemaFormComponent implements AfterContentInit, AfterViewInit, DoCheck, OnChanges, OnInit {
  private formActive: boolean = false; // Used to trigger form rendering
  private masterSchema: any = {}; // The internal JSON Schema
  private masterLayout: any[] = []; // The internal Form layout
  private initialData: any = {}; // The initial Data model (e.g. previously submitted data)
  private formGroupTemplate: any = {}; // Template used to create formGroup
  private masterFormGroup: FormGroup; // Angular 2 formGroup, for powering reactive form
  private schemaRefLibrary: any = {}; // Library of references for schema $refs
  private fieldMap: any = {}; // Links schema, layout, formGroup template, and data
  private ajv: any = new Ajv({ allErrors: true }); // AJV JSON Schema validator
  private validateFormData: any = null; // Compiled AJV to validate this form's schema
  private debugOutput: any; // Debug information, if requested
  private formOptions: any = { // Global form options, with default values
    supressPropertyTitles: false,
    fieldsRequired: false,
    formDefaults: { notitle: false, readonly: false, feedback: true, },
    framework: null, // The active framework
    masterLayout: null, // Will link to this.masterLayout
    noSubmit: false, // Even if layout does not have a submit button, do not add one
    pristine: { errors: true, success: true },
    setSchemaDefaults: true,
    validateOnRender: false,
    validationMessage: {},
    layoutRefLibrary: {}, // Layouts for adding dynamic arrays and circular schema $refs
  };

  @Input() schema: any; // The input JSON Schema
  @Input() data: any; // The input Form layout
  @Input() layout: any[]; // The input Data model
  @Input() options: any; // The input form options
  @Input() form: any; // For testing and JSON Schema Form API compatibility
  @Input() model: any; // For Angular Schema Form API compatibility
  @Input() JSONSchema: any; // For React JSON Schema Form API compatibility
  @Input() UISchema: any; // For React JSON Schema Form API compatibility
  @Input() formData: any; // For React JSON Schema Form API compatibility
  @Input() debug: boolean; // Show debug information?
  @Output() onChanges = new EventEmitter<any>(); // Live unvalidated internal form data
  @Output() onSubmit = new EventEmitter<any>(); // Validated complete form data
  @Output() isValid = new EventEmitter<boolean>(); // Is current data valid?
  @Output() validationErrors = new EventEmitter<any>(); // Validation errors, if not valid

  constructor(
    private formBuilder: FormBuilder,
    private http: Http,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainer: ViewContainerRef,
    private widgetLibrary: WidgetLibraryService,
    private frameworkLibrary: FrameworkLibraryService,
  ) {
    this.masterFormGroup = this.formBuilder.group({});
  }

  ngOnInit() { }

  ngAfterContentInit() { }

  ngAfterViewInit() { }

  ngOnChanges() {
    if (isObject(this.options)) Object.assign(this.formOptions, this.options);
    this.formOptions.framework = this.frameworkLibrary.getFramework();
    this.buildFormInputs();
  }

  /**
   * 'buildFormInputs' function
   *
   * - Update 'masterSchema', 'masterLayout', and 'initialData',
   *   the inputs used to construct the form.
   *
   * - Create 'fieldMap' to map the relationships between the schema and layout.
   *
   * - Create 'schemaRefLibrary' to resolve schema $ref links.
   *
   * - Create 'formOptions.layoutRefLibrary' to add components to arrays and
   *   circular $ref points in the form.
   *
   * - Create 'formGroupTemplate', then from it 'masterFormGroup',
   *   the Angular 2 formGroup used to control the reactive form.
   *
   * @return {void}
   */
  public buildFormInputs() {
    if (
      this.form || this.layout || this.schema || this.data ||
      this.model || this.JSONSchema || this.UISchema || this.formData
    ) {
      this.formActive = false;
      this.masterSchema = {};
      this.masterLayout = [];
      this.initialData = {};
      this.fieldMap = {};
      this.schemaRefLibrary = {};
      this.formOptions.layoutRefLibrary = {};
      this.formGroupTemplate = {};
      this.masterFormGroup = this.formBuilder.group({});

      // Initialize 'masterSchema'
      // Use first available input:
      // 1. schema - recommended / Angular Schema Form style
      // 2. form.schema - Single input / JSON Form style
      // 3. JSONSchema - React JSON Schema Form style
      // 4. form.JSONSchema - For testing single input React JSON Schema Forms
      // 5. form - For easier testing
      // 6. (none) no schema - construct form entirely from layout instead
      if (isObject(this.schema)) {
        this.masterSchema = this.schema;
      } else if (hasOwn(this.form, 'schema') &&
        isObject(this.form.schema)) {
        this.masterSchema = this.form.schema;
      } else if (isObject(this.JSONSchema)) {
        this.masterSchema = this.JSONSchema;
      } else if (hasOwn(this.form, 'JSONSchema') &&
      isObject(this.form.JSONSchema)) {
        this.masterSchema = this.form.JSONSchema;
      } else if (hasOwn(this.form, 'properties') &&
        isObject(this.form.properties)) {
        this.masterSchema = this.form;
      }

      if (!isEmpty(this.masterSchema)) {

        // Allow for JSON schema shorthand (JSON Form style)
        if (!hasOwn(this.masterSchema, 'type') &&
          hasOwn(this.masterSchema, 'properties') &&
          isObject(this.masterSchema.properties)
        ) {
          this.masterSchema.type = 'object';
        } else if (!hasOwn(this.masterSchema, 'type') ||
          this.masterSchema.type !== 'object' ||
          !hasOwn(this.masterSchema, 'properties')
        ) {
          this.masterSchema = { 'type': 'object', 'properties': this.masterSchema };
        }

        // If JSON Schema is version 3 (JSON Form style), convert to version 4
        this.masterSchema = convertJsonSchema3to4(this.masterSchema);

        // Initialize ajv and compile schema
        this.validateFormData = this.ajv.compile(this.masterSchema);

        // Resolve schema $ref links, and save them in schemaRefLibrary
        JsonPointer.forEachDeep(this.masterSchema, (value, pointer) => {
          if (hasOwn(value, '$ref') && isString(value['$ref'])) {
            const newReference: string = JsonPointer.compile(value['$ref']);
            const isCircular = JsonPointer.isSubPointer(newReference, pointer);
            if (!hasOwn(this.schemaRefLibrary, newReference) && newReference !== '') {
              this.schemaRefLibrary[newReference] = getSchemaReference(
                this.masterSchema, newReference, this.schemaRefLibrary
              );
            }
            // If $ref link is not circular, remove it and replace
            // it with a copy of the schema it links to
            if (!isCircular) {
              delete value['$ref'];
              this.masterSchema = JsonPointer.set(this.masterSchema, pointer, Object.assign(
                _.cloneDeep(this.schemaRefLibrary[newReference]), value
              ));
            }
          }
        }, true);
      }

      // Initialize 'masterLayout'
      // Use first available array input:
      // 1. layout - recommended
      // 2. form - Angular Schema Form style
      // 3. form.form - JSON Form style
      // 4. form.layout - Single input style
      // 5. (none) no input - use default layout instead
      if (isArray(this.layout)) {
        this.masterLayout = this.layout;
      } else if (isArray(this.form)) {
        this.masterLayout = this.form;
      } else if (isArray(this.form.form)) {
        this.masterLayout = this.form.form;
      } else if (isArray(this.form.layout)) {
        this.masterLayout = this.form.layout;
      } else {
        this.masterLayout = [ '*', { type: 'submit', title: 'Submit' } ];
      }

      // Look for and import alternate layout format 'UISchema'
      // used for React JSON Schema Form API compatibility
      // Use first available input:
      // 1. UISchema - React JSON Schema Form style
      // 2. form.UISchema - For testing single input React JSON Schema Forms
      // 3. (none) no input - don't import UISchema
      if (isObject(this.UISchema) || hasOwn(this.form, 'UISchema')) {
        const UISchema = this.UISchema || this.form.UISchema;

        // if UISchema found, copy UISchema items into masterSchema
        JsonPointer.forEachDeep(UISchema, (value, pointer) => {
          const schemaPointer: string = pointer.replace(/\//g, '/properties/')
            .replace(/\/properties\/items\/properties\//g, '/items/properties/');
          if (!JsonPointer.has(this.masterSchema, schemaPointer)) {
            const groupPointer: string[] =
              JsonPointer.parse(schemaPointer).slice(0, -2);
            const item = JsonPointer.toKey(schemaPointer);
            const itemPointer: string | string[] =
              item === 'ui:order' ? schemaPointer : groupPointer.concat(item);
            if (JsonPointer.has(this.masterSchema, groupPointer) &&
              !JsonPointer.has(this.masterSchema, itemPointer)
            ) {
              JsonPointer.set(this.masterSchema, itemPointer, value);
            }
          }
        });
      }

      // Initialize 'initialData'
      // Use first available input:
      // 1. data - recommended
      // 2. model - Angular Schema Form style
      // 3. form.value - JSON Form style
      // 4. form.data - Single input style
      // 5. formData - React JSON Schema Form style
      // 6. form.formData - For easier testing of React JSON Schema Forms
      // 7. (none) no data - initialize data from schema and layout defaults
      if (isObject(this.data)) {
        this.initialData = this.data;
      } else if (isObject(this.model)) {
        this.initialData = this.model;
      } else if (isObject(this.form) &&
        isObject(this.form.value)) {
        this.initialData = this.form.value;
      } else if (isObject(this.form) &&
        isObject(this.form.data)) {
        this.initialData = this.form.data;
      } else if (isObject(this.formData)) {
        this.initialData = this.formData;
      } else if (hasOwn(this.form, 'formData') &&
        isObject(this.form.formData)) {
        this.initialData = this.form.formData;
      }

      if (!isEmpty(this.masterSchema)) {

        // Build the Angular 2 FormGroup template from the schema
        this.formGroupTemplate = buildFormGroupTemplate(
          this.masterSchema, this.schemaRefLibrary,
          this.fieldMap, this.initialData
        );
      } else {

        // TODO: If the schema does not exist,
        // build the Angular 2 FormGroup template from the layout instead
        // this.formGroupTemplate =
        //   this.buildFormGroupTemplateFromLayout(this.masterLayout, this.fieldMap);
      }

      // Update all layout elements, set values, and add validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      // TODO: Update layout and Angular 2 FormGroup template from data
      // (set default values and extend arrays)
      this.masterLayout = buildLayout(
        this.masterLayout, this.masterSchema, this.initialData, this.formOptions,
        this.fieldMap, this.schemaRefLibrary, this.formOptions.layoutRefLibrary,
        this.widgetLibrary, this.formGroupTemplate
      );

      // Make entire form layout available to all controls
      this.formOptions.masterLayout = this.masterLayout;

      // Build the real Angular 2 FormGroup from the FormGroup template
      this.masterFormGroup = <FormGroup>(buildFormGroup(this.formGroupTemplate));

      if (this.masterFormGroup) {
console.log(this.masterFormGroup);
        // Activate the *ngIf in the template to render form
        this.formActive = true;

        // Subscribe to form value changes to output live data, validation, and errors
        this.masterFormGroup.valueChanges.subscribe(
          value => {
            const formattedData = formatFormData(value, this.fieldMap);
            this.onChanges.emit(formattedData);
            // this.onChanges.emit(value);
            const isValid = this.validateFormData(formattedData);
            this.isValid.emit(isValid);
            this.validationErrors.emit(this.validateFormData.errors);
          }
        );

        // Output initial data
        this.onChanges.emit(formatFormData(this.masterFormGroup.value, this.fieldMap));

        // If 'validateOnRender' = true, output initial validation and any errors
        if (this.formOptions.validateOnRender) {
          const isValid = this.validateFormData(formatFormData(this.masterFormGroup.value, this.fieldMap));
          this.isValid.emit(isValid);
          this.validationErrors.emit(this.validateFormData.errors);
        }
      } else {
        // TODO: Output error message
      }
    }
  }

  // Output debugging information
  ngDoCheck() {
    if (this.debug) {
      const vars: any[] = [];
      vars.push(this.masterSchema);
      // vars.push(this.fieldMap);
      // vars.push(this.formGroupTemplate);
      // vars.push(this.masterLayout);
      // vars.push(this.schemaRefLibrary);
      // vars.push(this.initialData);
      // vars.push(this.masterFormGroup);
      // vars.push(this.masterFormGroup.value);
      // vars.push(this.formOptions.layoutRefLibrary);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  private submitForm() {
    this.onSubmit.emit(formatFormData(this.masterFormGroup.value, this.fieldMap, true));
  }
}
