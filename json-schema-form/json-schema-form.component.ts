import {
  ChangeDetectionStrategy, Component, DoCheck, EventEmitter, Input, Output,
  OnChanges, OnInit,
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import * as Ajv from 'ajv';
import * as _ from 'lodash';

import { JsonSchemaFormService } from './json-schema-form.service';
import { FrameworkLibraryService } from './frameworks/framework-library.service';
import { WidgetLibraryService } from './widgets/widget-library.service';
import {
  buildFormGroup, buildFormGroupTemplate, buildLayout, convertJsonSchema3to4,
  fixJsonFormOptions, formatFormData, getSchemaReference, hasOwn,
  hasValue, isArray, isEmpty, isObject, isString, JsonPointer
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
  template: `
    <form (ngSubmit)="submitForm()">
      <root-widget *ngIf="formInitialized"
        [layout]="jsf.layout">
      </root-widget>
    </form>
    <div *ngIf="debug">Debug output: <pre>{{debugOutput}}</pre></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaFormComponent implements DoCheck, OnChanges, OnInit {
  private formInitialized: boolean = false; // Used to trigger form rendering
  private ajv: any = new Ajv({ allErrors: true }); // AJV: Another JSON Schema Validator
  private validateFormData: any; // Compiled AJV function to validate this form's schema
  private debugOutput: any; // Debug information, if requested

  @Input() schema: any; // The input JSON Schema
  @Input() layout: any[]; // The input Data model
  @Input() data: any; // The input Form layout
  @Input() options: any; // The input form global options
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
    private frameworkLibrary: FrameworkLibraryService,
    private widgetLibrary: WidgetLibraryService,
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() { }

  ngOnChanges() {
    this.jsf.framework = this.frameworkLibrary.getFramework();
    if (isObject(this.options)) Object.assign(this.jsf.globalOptions, this.options);
    this.initializeForm();
  }

  /**
   * 'initializeForm' function
   *
   * - Update 'schema', 'layout', and 'initialValues', from inputs.
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
  public initializeForm() {
    if (
      this.schema || this.layout || this.form || this.JSONSchema || this.UISchema
    ) {
      this.formInitialized = false;
      this.jsf.schema = {};
      this.jsf.layout = [];
      this.jsf.initialValues = {};
      this.jsf.dataMap = new Map<string, any>();
      this.jsf.schemaRefLibrary = {};
      this.jsf.layoutRefLibrary = {};
      this.jsf.formGroupTemplate = {};
      this.jsf.formGroup = null;
      this.jsf.framework = this.frameworkLibrary.getFramework();
      this.jsf.globalOptions.debug = !!this.debug;

      // Initialize 'schema'
      // Use first available input:
      // 1. schema - recommended / Angular Schema Form style
      // 2. form.schema - Single input / JSON Form style
      // 3. JSONSchema - React JSON Schema Form style
      // 4. form.JSONSchema - For testing single input React JSON Schema Forms
      // 5. form - For easier testing
      // 6. (none) no schema - construct form entirely from layout instead
      if (isObject(this.schema)) {
        this.jsf.AngularSchemaFormCompatibility = true;
        this.jsf.schema = this.schema;
      } else if (hasOwn(this.form, 'schema') && isObject(this.form.schema)) {
        this.jsf.schema = this.form.schema;
      } else if (isObject(this.JSONSchema)) {
        this.jsf.ReactJsonSchemaFormCompatibility = true;
        this.jsf.schema = this.JSONSchema;
      } else if (hasOwn(this.form, 'JSONSchema') && isObject(this.form.JSONSchema)) {
        this.jsf.ReactJsonSchemaFormCompatibility = true;
        this.jsf.schema = this.form.JSONSchema;
      } else if (hasOwn(this.form, 'properties') && isObject(this.form.properties)) {
        this.jsf.schema = this.form;
      }

      if (!isEmpty(this.jsf.schema)) {

        // Allow for JSON schema shorthand (JSON Form style)
        if (!hasOwn(this.jsf.schema, 'type') &&
          hasOwn(this.jsf.schema, 'properties') &&
          isObject(this.jsf.schema.properties)
        ) {
          this.jsf.schema.type = 'object';
        } else if (!hasOwn(this.jsf.schema, 'type') ||
          this.jsf.schema.type !== 'object' ||
          !hasOwn(this.jsf.schema, 'properties')
        ) {
          this.jsf.JsonFormCompatibility = true;
          this.jsf.schema = {
            'type': 'object', 'properties': this.jsf.schema
          };
        }

        // If JSON Schema is version 3 (JSON Form style), convert it to version 4
        this.jsf.schema = convertJsonSchema3to4(this.jsf.schema);

        // Initialize ajv and compile schema
        this.validateFormData = this.ajv.compile(this.jsf.schema);

        // Resolve schema $ref links, and save them in schemaRefLibrary
        JsonPointer.forEachDeep(this.jsf.schema, (value, pointer) => {
          if (hasOwn(value, '$ref') && isString(value['$ref'])) {
            const newReference: string = JsonPointer.compile(value['$ref']);
            const isCircular = JsonPointer.isSubPointer(newReference, pointer);
            if (hasValue(newReference) &&
              !hasOwn(this.jsf.schemaRefLibrary, newReference)
            ) {
              this.jsf.schemaRefLibrary[newReference] = getSchemaReference(
                this.jsf.schema, newReference, this.jsf.schemaRefLibrary
              );
            }

            // If a $ref link is not circular, remove it and replace
            // it with a copy of the schema it links to
            if (!isCircular) {
              delete value['$ref'];
              this.jsf.schema = JsonPointer.set(
                this.jsf.schema, pointer, Object.assign(
                  _.cloneDeep(this.jsf.schemaRefLibrary[newReference]),
                  value
                )
              );
            } else {
              this.jsf.schemaCircularRefMap.set(pointer, newReference);
            }
          }
        }, true);
      }

      // Initialize 'layout'
      // Use first available array input:
      // 1. layout - recommended
      // 2. form - Angular Schema Form style
      // 3. form.form - JSON Form style
      // 4. form.layout - Single input style
      // 5. (none) no input - use default layout instead
      if (isArray(this.layout)) {
        this.jsf.layout = this.layout;
      } else if (isArray(this.form)) {
        this.jsf.AngularSchemaFormCompatibility = true;
        this.jsf.layout = this.form;
      } else if (isArray(this.form.form)) {
        this.jsf.JsonFormCompatibility = true;
        fixJsonFormOptions(this.form.form);
        this.jsf.layout = this.form.form;
      } else if (isArray(this.form.layout)) {
        this.jsf.layout = this.form.layout;
      } else {
        this.jsf.layout = [ '*', { type: 'submit', title: 'Submit' } ];
      }

      // Import alternate layout formats 'UISchema' or 'customFormItems'
      // used for React JSON Schema Form and JSON Form API compatibility
      // Use first available input:
      // 1. UISchema - React JSON Schema Form style
      // 2. form.UISchema - For testing single input React JSON Schema Forms
      // 2. form.customFormItems - JSON Form style
      // 3. (none) no input - don't import
      let alternateLayout: any = null;
      if (isObject(this.UISchema)) {
        this.jsf.ReactJsonSchemaFormCompatibility = true;
        alternateLayout = this.UISchema;
      } else if (hasOwn(this.form, 'UISchema')) {
        this.jsf.ReactJsonSchemaFormCompatibility = true;
        alternateLayout = this.form.UISchema;
      } else if (hasOwn(this.form, 'customFormItems')) {
        this.jsf.JsonFormCompatibility = true;
        fixJsonFormOptions(this.form.customFormItems);
        alternateLayout = this.form.customFormItems;
      }
      // if alternate layout found, copy options into schema
      if (alternateLayout) {
        JsonPointer.forEachDeep(alternateLayout, (value, pointer) => {
          const schemaPointer: string = pointer.replace(/\//g, '/properties/')
            .replace(/\/properties\/items\/properties\//g, '/items/properties/')
            .replace(/\/properties\/titleMap\/properties\//g, '/titleMap/properties/');
          if (hasValue(value) && hasValue(pointer)) {
            const groupPointer: string[] =
              JsonPointer.parse(schemaPointer).slice(0, -2);
            let key = JsonPointer.toKey(schemaPointer);
            let itemPointer: string | string[];
            // If 'ui:order' object found, copy into schema root
            if (key === 'ui:order') {
              itemPointer = schemaPointer;
            // Copy other alternate layout options to schema 'x-schema-form',
            // (like Angular Schema Form options) and remove any 'ui:' prefixes
            } else {
              itemPointer = groupPointer.concat(['x-schema-form',
                key.slice(0, 3) === 'ui:' ? key.slice(3) : key
              ]);
            }
            if (JsonPointer.has(this.jsf.schema, groupPointer) &&
              !JsonPointer.has(this.jsf.schema, itemPointer)
            ) {
              JsonPointer.set(this.jsf.schema, itemPointer, value);
            }
          }
        });
      }

      // Initialize 'initialValues'
      // Use first available input:
      // 1. data - recommended
      // 2. model - Angular Schema Form style
      // 3. form.value - JSON Form style
      // 4. form.data - Single input style
      // 5. formData - React JSON Schema Form style
      // 6. form.formData - For easier testing of React JSON Schema Forms
      // 7. (none) no data - initialize data from schema and layout defaults only
      if (isObject(this.data)) {
        this.jsf.initialValues = this.data;
      } else if (isObject(this.model)) {
        this.jsf.AngularSchemaFormCompatibility = true;
        this.jsf.initialValues = this.model;
      } else if (isObject(this.form) && isObject(this.form.value)) {
        this.jsf.JsonFormCompatibility = true;
        this.jsf.initialValues = this.form.value;
      } else if (isObject(this.form) && isObject(this.form.data)) {
        this.jsf.initialValues = this.form.data;
      } else if (isObject(this.formData)) {
        this.jsf.ReactJsonSchemaFormCompatibility = true;
        this.jsf.initialValues = this.formData;
      } else if (hasOwn(this.form, 'formData') && isObject(this.form.formData)) {
        this.jsf.ReactJsonSchemaFormCompatibility = true;
        this.jsf.initialValues = this.form.formData;
      }

      if (!isEmpty(this.jsf.schema)) {

        // Build the Angular 2 FormGroup template from the schema
        this.jsf.formGroupTemplate = buildFormGroupTemplate(
          this.jsf, this.jsf.initialValues, true
        );

      } else {

        // TODO: (?) If the schema does not exist,
        // build the Angular 2 FormGroup template from the layout instead
        // this.formGroupTemplate =
        //   this.buildFormGroupTemplateFromLayout(this.jsf.layout, this.jsf);
      }

      // Update all layout elements, set values, and add validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      this.jsf.layout = buildLayout(this.jsf, this.widgetLibrary);

      // Build the real Angular 2 FormGroup from the FormGroup template
      this.jsf.formGroup = <FormGroup>buildFormGroup(this.jsf.formGroupTemplate);

      if (this.jsf.formGroup) {

        // Display the template to render form
        this.formInitialized = true;

        // Subscribe to form value changes to output live data, validation, and errors
        this.jsf.formGroup.valueChanges.subscribe(
          value => {
            const formattedData = formatFormData(
              value, this.jsf.dataMap, this.jsf.dataCircularRefMap, this.jsf.arrayMap
            );
            this.onChanges.emit(formattedData); // Formatted output
            // this.onChanges.emit(value); // Non-formatted output
            const isValid = this.validateFormData(formattedData);
            this.isValid.emit(isValid);
            this.validationErrors.emit(this.validateFormData.errors);
          }
        );

        // Output initial data
        this.onChanges.emit(formatFormData(
          this.jsf.formGroup.value, this.jsf.dataMap,
          this.jsf.dataCircularRefMap, this.jsf.arrayMap
        ));

        // If 'validateOnRender' = true, output initial validation and any errors
        if (JsonPointer.get(this.jsf, '/globalOptions/validateOnRender')) {
          const isValid = this.validateFormData(formatFormData(
            this.jsf.formGroup.value, this.jsf.dataMap,
            this.jsf.dataCircularRefMap, this.jsf.arrayMap
          ));
          this.isValid.emit(isValid);
          this.validationErrors.emit(this.validateFormData.errors);
        }
// Debug info:
// console.log(this.jsf.formGroupTemplate);
// console.log(this.jsf.formGroup);
// console.log(this.jsf.templateRefLibrary);
// console.log(this.jsf.layoutRefLibrary);
// console.log(this.jsf.schema);
// console.log(this.jsf.layout);
// console.log(this.jsf.schemaRefLibrary);
// console.log(this.jsf.dataMap);
// console.log(this.jsf.schemaCircularRefMap);
// console.log(this.jsf.dataCircularRefMap);
      } else {
        // TODO: Output error message
      }
    }
  }

  // Output debugging information
  ngDoCheck() {
    if (this.debug) {
      const vars: any[] = [];
      // vars.push(this.jsf.schema);
      // vars.push(this.jsf.dataMap);
      // vars.push(this.jsf.arrayMap);
      // vars.push(this.jsf.formGroupTemplate);
      // vars.push(this.jsf.layout);
      // vars.push(this.jsf.schemaRefLibrary);
      // vars.push(this.jsf.initialValues);
      // vars.push(this.jsf.formGroup);
      // vars.push(this.jsf.formGroup.value);
      // vars.push(this.jsf.layoutRefLibrary);
      // vars.push(this.jsf.templateRefLibrary);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  private submitForm() {
    this.onSubmit.emit(formatFormData(
      this.jsf.formGroup.value, this.jsf.dataMap,
      this.jsf.dataCircularRefMap, this.jsf.arrayMap, true
    ));
  }
}
