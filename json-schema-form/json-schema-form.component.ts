import {
  ChangeDetectionStrategy, Component, ComponentFactoryResolver, ComponentRef,
  DoCheck, EventEmitter, Input, Output, OnChanges, OnInit, AfterContentInit,
  AfterViewInit, ViewChild, ViewContainerRef
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
import * as Immutable from 'immutable';

import { FrameworkLibraryService } from './frameworks/framework-library.service';
import { WidgetLibraryService } from './widgets/widget-library.service';
import {
  buildFormGroup, buildFormGroupTemplate, buildLayout, convertJsonSchema3to4,
  formatFormData, getSchemaReference, hasOwn, isArray, isEmpty, isObject,
  isSet, isString, JsonPointer, toGenericPointer
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
      [layoutNode]="formOptions.layout"
      [options]="formOptions"
      [isFirstRoot]="true"
      [debug]="debug">
    </root-widget>
  </form>
  <div *ngIf="debug">Debug output: <pre>{{debugOutput}}</pre></div>`,
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaFormComponent implements AfterContentInit, AfterViewInit, DoCheck, OnChanges, OnInit {
  private formActive: boolean = false; // Used to trigger form rendering
  private ajv: any = new Ajv({ allErrors: true }); // AJV: Another JSON Schema Validator
  private validateFormData: any; // Compiled AJV function to validate this form's schema
  private debugOutput: any; // Debug information, if requested

  private formOptions: any = { // Form options and control structures
    globalOptions: { // Default global form options
      addSubmit: true, // Add a submit button if layout does not have one?
      fieldsRequired: false, // Are there any required fields in the form?
      pristine: { errors: true, success: true },
      supressPropertyTitles: false,
      setSchemaDefaults: true,
      validateOnRender: false,
      formDefaults: { // Default options for individual form controls
        allowExponents: false, // Allow exponent entry in number fields?
        disableErrorState: false, // Don't apply 'has-error' class when field fails validation?
        disableSuccessState: false, // Don't apply 'has-success' class when field validates?
        feedback: true, // Show inline feedback icons?
        notitle: false, // Hide title?
        readonly: false, // Set control as read only?
      },
    },
    arrayMap: new Map, // Map of arrays in data object
    defaultValues: {}, // The initial data model (e.g. previously submitted data)
    dataMap: new Map, // Maps paths in data model to schema and formGroup
    formGroupTemplate: {}, // Template used to create formGroup
    framework: null, // The active framework component
    schema: {}, // The internal JSON Schema
    layout: [], // The internal Form layout
    formGroup: null, // Angular 2 formGroup, for powering reactive form
    layoutRefLibrary: {}, // Library of layout nodes for adding to form
    schemaRefLibrary: {}, // Library of schemas for resolving schema $refs
    templateRefLibrary: {}, // Library of formGroup templates for adding to form
    widgetLibrary: null,
  };

  @Input() schema: any; // The input JSON Schema
  @Input() layout: any[]; // The input Data model
  @Input() data: any; // The input Form layout
  @Input() options: any; // The input form options
  @Input() form: any; // For testing, and JSON Schema Form API compatibility
  @Input() model: any; // For Angular Schema Form API compatibility
  @Input() JSONSchema: any; // For React JSON Schema Form API compatibility
  @Input() UISchema: any; // For React JSON Schema Form API compatibility
  @Input() formData: any; // For React JSON Schema Form API compatibility
  @Input() debug: boolean; // Show debug information?
  @Output() onChanges = new EventEmitter<any>(); // Live unvalidated internal form data
  @Output() onSubmit = new EventEmitter<any>(); // Validated complete form data
  @Output() isValid = new EventEmitter<boolean>(); // Is current data valid?
  @Output() validationErrors = new EventEmitter<any>(); // Validation errors

  constructor(
    private formBuilder: FormBuilder,
    private http: Http,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainer: ViewContainerRef,
    private widgetLibrary: WidgetLibraryService,
    private frameworkLibrary: FrameworkLibraryService,
  ) {
    this.formOptions.formGroup = this.formBuilder.group({});
    this.formOptions.widgetLibrary = widgetLibrary;
  }

  ngOnInit() { }

  ngAfterContentInit() { }

  ngAfterViewInit() { }

  ngOnChanges() {
    if (isObject(this.options)) Object.assign(this.formOptions.globalOptions, this.options);
    this.formOptions.framework = this.frameworkLibrary.getFramework();
    this.buildFormInputs(this.formOptions);
  }

  /**
   * 'buildFormInputs' function
   *
   * - Update 'schema', 'layout', and 'defaultValues', from inputs.
   *
   * - Create 'dataMap' to map the data to the schema and template.
   *
   * - Create 'schemaRefLibrary' to resolve schema $ref links.
   *
   * - Create 'layoutRefLibrary' to use when adding components to form
   *   arrays and circular $ref points.
   *
   * - Create 'formGroupTemplate', then from it 'formGroup',
   *   the Angular 2 formGroup used to control the reactive form.
   *
   * @return {void}
   */
  public buildFormInputs(options: any) {
    if (
      this.schema || this.layout || this.form || this.JSONSchema || this.UISchema
    ) {
      this.formActive = false;
      options.schema = {};
      options.layout = [];
      options.defaultValues = {};
      options.dataMap = new Map;
      options.schemaRefLibrary = {};
      options.layoutRefLibrary = {};
      options.formGroupTemplate = {};
      options.formGroup = null;

      // Initialize 'formOptions.schema'
      // Use first available input:
      // 1. schema - recommended / Angular Schema Form style
      // 2. form.schema - Single input / JSON Form style
      // 3. JSONSchema - React JSON Schema Form style
      // 4. form.JSONSchema - For testing single input React JSON Schema Forms
      // 5. form - For easier testing
      // 6. (none) no schema - construct form entirely from layout instead
      if (isObject(this.schema)) {
        options.schema = this.schema;
      } else if (hasOwn(this.form, 'schema') &&
        isObject(this.form.schema)) {
        options.schema = this.form.schema;
      } else if (isObject(this.JSONSchema)) {
        options.schema = this.JSONSchema;
      } else if (hasOwn(this.form, 'JSONSchema') &&
      isObject(this.form.JSONSchema)) {
        options.schema = this.form.JSONSchema;
      } else if (hasOwn(this.form, 'properties') &&
        isObject(this.form.properties)) {
        options.schema = this.form;
      }

      if (!isEmpty(options.schema)) {

        // Allow for JSON schema shorthand (JSON Form style)
        if (!hasOwn(options.schema, 'type') &&
          hasOwn(options.schema, 'properties') &&
          isObject(options.schema.properties)
        ) {
          options.schema.type = 'object';
        } else if (!hasOwn(options.schema, 'type') ||
          options.schema.type !== 'object' ||
          !hasOwn(options.schema, 'properties')
        ) {
          options.schema = {
            'type': 'object', 'properties': options.schema
          };
        }

        // If JSON Schema is version 3 (JSON Form style), convert it to version 4
        options.schema = convertJsonSchema3to4(options.schema);

        // Initialize ajv and compile schema
        this.validateFormData = this.ajv.compile(options.schema);

        // Resolve schema $ref links, and save them in schemaRefLibrary
        JsonPointer.forEachDeep(options.schema, (value, pointer) => {
          if (hasOwn(value, '$ref') && isString(value['$ref'])) {
            const newReference: string = JsonPointer.compile(value['$ref']);
            const isCircular = JsonPointer.isSubPointer(newReference, pointer);
            if (isSet(newReference) &&
              !hasOwn(options.schemaRefLibrary, newReference)
            ) {
              options.schemaRefLibrary[newReference] = getSchemaReference(
                options.schema, newReference, options.schemaRefLibrary
              );
            }

            // If a $ref link is not circular, remove it and replace
            // it with a copy of the schema it links to
            if (!isCircular) {
              delete value['$ref'];
              options.schema = JsonPointer.set(
                options.schema, pointer, Object.assign(
                  _.cloneDeep(options.schemaRefLibrary[newReference]),
                  value
                )
              );
            }
          }
        }, true);
      }

      // Initialize 'formOptions.layout'
      // Use first available array input:
      // 1. layout - recommended
      // 2. form - Angular Schema Form style
      // 3. form.form - JSON Form style
      // 4. form.layout - Single input style
      // 5. (none) no input - use default layout instead
      if (isArray(this.layout)) {
        options.layout = this.layout;
      } else if (isArray(this.form)) {
        options.layout = this.form;
      } else if (isArray(this.form.form)) {
        options.layout = this.form.form;
      } else if (isArray(this.form.layout)) {
        options.layout = this.form.layout;
      } else {
        options.layout = [ '*', { type: 'submit', title: 'Submit' } ];
      }

      // Look for and import alternate layout format 'UISchema'
      // used for React JSON Schema Form API compatibility
      // Use first available input:
      // 1. UISchema - React JSON Schema Form style
      // 2. form.UISchema - For testing single input React JSON Schema Forms
      // 3. (none) no input - don't import UISchema
      if (isObject(this.UISchema) || hasOwn(this.form, 'UISchema')) {
        const UISchema = this.UISchema || this.form.UISchema;

        // if UISchema found, copy UISchema items into formOptions.schema
        JsonPointer.forEachDeep(UISchema, (value, pointer) => {
          const schemaPointer: string = pointer.replace(/\//g, '/properties/')
            .replace(/\/properties\/items\/properties\//g, '/items/properties/');
          if (!JsonPointer.has(options.schema, schemaPointer)) {
            const groupPointer: string[] =
              JsonPointer.parse(schemaPointer).slice(0, -2);
            const item = JsonPointer.toKey(schemaPointer);
            const itemPointer: string | string[] =
              item === 'ui:order' ? schemaPointer : groupPointer.concat(item);
            if (JsonPointer.has(options.schema, groupPointer) &&
              !JsonPointer.has(options.schema, itemPointer)
            ) {
              JsonPointer.set(options.schema, itemPointer, value);
            }
          }
        });
      }

      // Initialize 'formOptions.defaultValues'
      // Use first available input:
      // 1. data - recommended
      // 2. model - Angular Schema Form style
      // 3. form.value - JSON Form style
      // 4. form.data - Single input style
      // 5. formData - React JSON Schema Form style
      // 6. form.formData - For easier testing of React JSON Schema Forms
      // 7. (none) no data - initialize data from schema and layout defaults
      if (isObject(this.data)) {
        options.defaultValues = this.data;
      } else if (isObject(this.model)) {
        options.defaultValues = this.model;
      } else if (isObject(this.form) &&
        isObject(this.form.value)) {
        options.defaultValues = this.form.value;
      } else if (isObject(this.form) &&
        isObject(this.form.data)) {
        options.defaultValues = this.form.data;
      } else if (isObject(this.formData)) {
        options.defaultValues = this.formData;
      } else if (hasOwn(this.form, 'formData') && isObject(this.form.formData)) {
        options.defaultValues = this.form.formData;
      }

      if (!isEmpty(options.schema)) {

        // Build the Angular 2 FormGroup template from the schema
        options.formGroupTemplate = buildFormGroupTemplate(options);

      } else {

        // TODO: (?) If the schema does not exist,
        // build the Angular 2 FormGroup template from the layout instead
        // this.formGroupTemplate =
        //   this.buildFormGroupTemplateFromLayout(options.layout, options);
      }

      // Update all layout elements, set values, and add validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      // TODO: Update layout and Angular 2 FormGroup template from data
      // (set default values and extend arrays)
      options.layout = buildLayout(options);

      // Build the real Angular 2 FormGroup from the FormGroup template
      options.formGroup = <FormGroup>buildFormGroup(options.formGroupTemplate);

      if (options.formGroup) {

        // Display the template to render form
        this.formActive = true;

        // Subscribe to form value changes to output live data, validation, and errors
        options.formGroup.valueChanges.subscribe(
          value => {
            const formattedData = formatFormData(value, options);
            this.onChanges.emit(formattedData); // Formatted output
            // this.onChanges.emit(value); // Non-formatted output
            const isValid = this.validateFormData(formattedData);
            this.isValid.emit(isValid);
            this.validationErrors.emit(this.validateFormData.errors);
          }
        );

        // Output initial data
        this.onChanges.emit(formatFormData(options.formGroup.value, options));

        // If 'validateOnRender' = true, output initial validation and any errors
        if (options.globalOptions.validateOnRender) {
          const isValid =
            this.validateFormData(formatFormData(options.formGroup.value, options));
          this.isValid.emit(isValid);
          this.validationErrors.emit(this.validateFormData.errors);
        }
console.log(options.formGroup);
      } else {
        // TODO: Output error message
      }
    }
  }

  // Output debugging information
  ngDoCheck() {
    if (this.debug) {
      const vars: any[] = [];
      // vars.push(this.formOptions.schema);
      // vars.push(this.formOptions.dataMap);
      // vars.push(this.formOptions.arrayMap);
      vars.push(this.formOptions.formGroupTemplate);
      // vars.push(this.formOptions.layout);
      // vars.push(this.formOptions.schemaRefLibrary);
      // vars.push(this.formOptions.defaultValues);
      // vars.push(this.formOptions.formGroup);
      // vars.push(this.formOptions.formGroup.value);
      // vars.push(this.formOptions.layoutRefLibrary);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  private submitForm() {
    this.onSubmit.emit(formatFormData(this.formOptions.formGroup.value, this.formOptions, true));
  }
}
