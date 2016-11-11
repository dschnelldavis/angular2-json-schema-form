import {
  ChangeDetectionStrategy, Component, DoCheck, EventEmitter, Input, Output,
  OnChanges, OnInit,
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import * as Ajv from 'ajv';
import * as _ from 'lodash';

import { FrameworkLibraryService } from './frameworks/framework-library.service';
import { WidgetLibraryService } from './widgets/widget-library.service';
import {
  buildFormGroup, buildFormGroupTemplate, buildLayout, convertJsonSchema3to4,
  fixJsonFormOptions, formatFormData, getControl, getSchemaReference, hasOwn,
  hasValue, isArray, isDefined, isEmpty, isObject, isString, JsonPointer,
  toGenericPointer, toIndexedPointer
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
    <root-widget *ngIf="formInitialized"
      [layout]="formSettings.layout"
      [formSettings]="formSettings"
      [isOrderable]="true">
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
  private JsonFormCompatibility: boolean = false;
  private ReactJsonSchemaFormCompatibility: boolean = false;
  private AngularSchemaFormCompatibility: boolean = false;

  private formSettings: any = { // Form options and control structures

    // Default global form options
    globalOptions: {
      addSubmit: true, // Add a submit button if layout does not have one?
      debug: false, // Show debugging output?
      fieldsRequired: false, // Are there any required fields in the form?
      pristine: { errors: true, success: true },
      // supressPropertyTitles: false,
      setSchemaDefaults: true,
      // validateOnRender: false,
      formDefaults: { // Default options for individual form controls
        // addable: true, // Allow adding items to an array?
        // orderable: true, // Allow reordering items within an array?
        // removable: true, // Allow removing items from an array?
        // allowExponents: false, // Allow exponent entry in number fields?
        // disableErrorState: false, // Don't apply 'has-error' class when field fails validation?
        // disableSuccessState: false, // Don't apply 'has-success' class when field validates?
        feedback: true, // Show inline feedback icons?
        // notitle: false, // Hide title?
        // readonly: false, // Set control as read only?
      },
    },

    initialValues: {}, // The initial data model (e.g. previously submitted data)
    schema: {}, // The internal JSON Schema
    layout: [], // The internal Form layout
    formGroupTemplate: {}, // The template used to create formGroup
    formGroup: null, // The Angular 2 formGroup, which powers the reactive form

    framework: null, // The active framework component

    arrayMap: new Map, // Maps arrays in data object and number of tuple values
    dataMap: new Map, // Maps paths in data model to schema and formGroup paths
    layoutRefLibrary: {}, // Library of layout nodes for adding to form
    schemaRefLibrary: {}, // Library of schemas for resolving schema $refs
    templateRefLibrary: {}, // Library of formGroup templates for adding to form

    initializeControl: (ctx): boolean => {
      ctx.formControl = this.formSettings.getControl(ctx);
      ctx.boundControl = !!ctx.formControl;
      if (ctx.boundControl) {
        ctx.controlName = this.formSettings.getControlName(ctx);
        ctx.controlValue = ctx.formControl.value;
        ctx.formControl.valueChanges.subscribe(v => ctx.controlValue = v);
      } else {
        ctx.controlName = ctx.layoutNode.name;
        ctx.controlValue = ctx.layoutNode.value;
        const dataPointer = this.formSettings.getDataPointer(ctx);
        if (dataPointer) {
          console.error(
            'warning: control "' + dataPointer +
            '" is not bound to the Angular 2 FormGroup.'
          );
        }
      }
      return ctx.boundControl;
    },

    updateValue: (ctx, event): void => {
      ctx.controlValue = event.target.value;
      if (ctx.boundControl) {
        ctx.formControl.setValue(event.target.value);
        ctx.formControl.markAsDirty();
      } else {
        ctx.layoutNode.value = event.target.value;
      }
    },

    getControl: (ctx): AbstractControl => {
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer ||
        ctx.layoutNode.type === '$ref') return null;
      return getControl(
        this.formSettings.formGroup,
        this.formSettings.getDataPointer(ctx)
      );
    },

    getControlValue: (ctx): AbstractControl => {
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer ||
        ctx.layoutNode.type === '$ref') return null;
      const control = getControl(
        this.formSettings.formGroup,
        this.formSettings.getDataPointer(ctx)
      );
      return control ? control.value : null;
    },

    getControlGroup: (ctx): FormGroup => {
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer) return null;
      return getControl(
        this.formSettings.formGroup,
        this.formSettings.getDataPointer(ctx),
        true
      );
    },

    getControlName: (ctx): string => {
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) return null;
      return JsonPointer.toKey(toIndexedPointer(
        ctx.layoutNode.dataPointer, ctx.dataIndex, this.formSettings.arrayMap
      ));
    },

    getLayoutArray: (ctx): any[] => {
      return JsonPointer.get(
        this.formSettings.layout,
        JsonPointer.parse(this.formSettings.getLayoutPointer(ctx)).slice(0, -1)
      );
    },

    getDataPointer: (ctx): string => {
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) return null;
      return toIndexedPointer(ctx.layoutNode.dataPointer, ctx.dataIndex);
    },

    getLayoutPointer: (ctx): string => {
      if (!ctx.layoutNode || !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) return null;
      return toIndexedPointer(ctx.layoutNode.layoutPointer, ctx.layoutIndex);
    },

    isControlBound: (ctx): boolean => {
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer ||
        !ctx.dataIndex) return false;
      const dataPointer = this.formSettings.getDataPointer(ctx);
      const control = this.formSettings.getControlGroup(ctx);
      if (!control) return false;
      return control.controls.hasOwnProperty(JsonPointer.toKey(dataPointer));
    },

    addItem: (ctx): boolean => { // TODO: Change to also add circular reference items
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex ||
        !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) return false;
      // Add new data key to formGroup
      const genericDataPointer = ctx.layoutNode.dataPointer;
      const indexedDataPointer = this.formSettings.getDataPointer(ctx);
      const templateLibrary = this.formSettings.templateRefLibrary;
      const newFormGroup =
        buildFormGroup(JsonPointer.get(templateLibrary, [genericDataPointer]));
      let formArray =
        getControl(this.formSettings.formGroup, indexedDataPointer, true);
      formArray.push(newFormGroup);
      // Add new display node to layout
      const layoutPointer = this.formSettings.getLayoutPointer(ctx);
      const newLayoutNode = _.cloneDeep(JsonPointer.get(
        this.formSettings.layoutRefLibrary, [genericDataPointer]
      ));
      JsonPointer.insert(this.formSettings.layout, layoutPointer, newLayoutNode);
      return true;
    },

    moveArrayItem: (ctx, oldIndex: number, newIndex: number): boolean => {
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex ||
        !ctx.layoutNode.layoutPointer || !ctx.layoutIndex ||
        !isDefined(oldIndex) || !isDefined(newIndex)) return false;
      // Move item in the formArray
      let formArray = this.formSettings.getControlGroup(ctx);
      formArray.controls.splice(newIndex, 0, formArray.controls.splice(oldIndex, 1)[0]);
      formArray.updateValueAndValidity();
      formArray._onCollectionChange();
      // Move layout item
      let layoutArray = this.formSettings.getLayoutArray(ctx);
      layoutArray.splice(newIndex, 0, layoutArray.splice(oldIndex, 1)[0]);
      return true;
    },

    removeItem: (ctx): boolean => { // TODO: Change to also remove circular reference items
      if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex ||
        !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) return false;
      // Remove data key from formGroup
      this.formSettings.getControlGroup(ctx)
        .removeAt(ctx.dataIndex[ctx.dataIndex.length - 1]);
      // Remove display node from layout
      let layoutPointer = this.formSettings.getLayoutPointer(ctx);
      JsonPointer.remove(this.formSettings.layout, layoutPointer);
      return true;
    }
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
    private widgetLibrary: WidgetLibraryService,
    private frameworkLibrary: FrameworkLibraryService,
  ) { }

  ngOnInit() { }

  ngOnChanges() {
    if (isObject(this.options)) Object.assign(this.formSettings.globalOptions, this.options);
    this.formSettings.globalOptions.debug = !!this.debug;
    this.formSettings.framework = this.frameworkLibrary.getFramework();
    this.buildFormInputs(this.formSettings);
  }

  /**
   * 'buildFormInputs' function
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
  public buildFormInputs(formSettings: any) {
    if (
      this.schema || this.layout || this.form || this.JSONSchema || this.UISchema
    ) {
      this.formInitialized = false;
      formSettings.schema = {};
      formSettings.layout = [];
      formSettings.initialValues = {};
      formSettings.dataMap = new Map;
      formSettings.schemaRefLibrary = {};
      formSettings.layoutRefLibrary = {};
      formSettings.formGroupTemplate = {};
      formSettings.formGroup = null;

      // Initialize 'schema'
      // Use first available input:
      // 1. schema - recommended / Angular Schema Form style
      // 2. form.schema - Single input / JSON Form style
      // 3. JSONSchema - React JSON Schema Form style
      // 4. form.JSONSchema - For testing single input React JSON Schema Forms
      // 5. form - For easier testing
      // 6. (none) no schema - construct form entirely from layout instead
      if (isObject(this.schema)) {
        this.AngularSchemaFormCompatibility = true;
        formSettings.schema = this.schema;
      } else if (hasOwn(this.form, 'schema') && isObject(this.form.schema)) {
        formSettings.schema = this.form.schema;
      } else if (isObject(this.JSONSchema)) {
        this.ReactJsonSchemaFormCompatibility = true;
        formSettings.schema = this.JSONSchema;
      } else if (hasOwn(this.form, 'JSONSchema') && isObject(this.form.JSONSchema)) {
        this.ReactJsonSchemaFormCompatibility = true;
        formSettings.schema = this.form.JSONSchema;
      } else if (hasOwn(this.form, 'properties') && isObject(this.form.properties)) {
        formSettings.schema = this.form;
      }

      if (!isEmpty(formSettings.schema)) {

        // Allow for JSON schema shorthand (JSON Form style)
        if (!hasOwn(formSettings.schema, 'type') &&
          hasOwn(formSettings.schema, 'properties') &&
          isObject(formSettings.schema.properties)
        ) {
          formSettings.schema.type = 'object';
        } else if (!hasOwn(formSettings.schema, 'type') ||
          formSettings.schema.type !== 'object' ||
          !hasOwn(formSettings.schema, 'properties')
        ) {
          this.JsonFormCompatibility = true;
          formSettings.schema = {
            'type': 'object', 'properties': formSettings.schema
          };
        }

        // If JSON Schema is version 3 (JSON Form style), convert it to version 4
        formSettings.schema = convertJsonSchema3to4(formSettings.schema);

        // Initialize ajv and compile schema
        this.validateFormData = this.ajv.compile(formSettings.schema);

        // Resolve schema $ref links, and save them in schemaRefLibrary
        JsonPointer.forEachDeep(formSettings.schema, (value, pointer) => {
          if (hasOwn(value, '$ref') && isString(value['$ref'])) {
            const newReference: string = JsonPointer.compile(value['$ref']);
            const isCircular = JsonPointer.isSubPointer(newReference, pointer);
            if (hasValue(newReference) &&
              !hasOwn(formSettings.schemaRefLibrary, newReference)
            ) {
              formSettings.schemaRefLibrary[newReference] = getSchemaReference(
                formSettings.schema, newReference, formSettings.schemaRefLibrary
              );
            }

            // If a $ref link is not circular, remove it and replace
            // it with a copy of the schema it links to
            if (!isCircular) {
              delete value['$ref'];
              formSettings.schema = JsonPointer.set(
                formSettings.schema, pointer, Object.assign(
                  _.cloneDeep(formSettings.schemaRefLibrary[newReference]),
                  value
                )
              );
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
        formSettings.layout = this.layout;
      } else if (isArray(this.form)) {
        this.AngularSchemaFormCompatibility = true;
        formSettings.layout = this.form;
      } else if (isArray(this.form.form)) {
        this.JsonFormCompatibility = true;
        fixJsonFormOptions(this.form.form);
        formSettings.layout = this.form.form;
      } else if (isArray(this.form.layout)) {
        formSettings.layout = this.form.layout;
      } else {
        formSettings.layout = [ '*', { type: 'submit', title: 'Submit' } ];
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
        this.ReactJsonSchemaFormCompatibility = true;
        alternateLayout = this.UISchema;
      } else if (hasOwn(this.form, 'UISchema')) {
        this.ReactJsonSchemaFormCompatibility = true;
        alternateLayout = this.form.UISchema;
      } else if (hasOwn(this.form, 'customFormItems')) {
        this.JsonFormCompatibility = true;
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
            if (JsonPointer.has(formSettings.schema, groupPointer) &&
              !JsonPointer.has(formSettings.schema, itemPointer)
            ) {
              JsonPointer.set(formSettings.schema, itemPointer, value);
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
        formSettings.initialValues = this.data;
      } else if (isObject(this.model)) {
        this.AngularSchemaFormCompatibility = true;
        formSettings.initialValues = this.model;
      } else if (isObject(this.form) && isObject(this.form.value)) {
        this.JsonFormCompatibility = true;
        formSettings.initialValues = this.form.value;
      } else if (isObject(this.form) && isObject(this.form.data)) {
        formSettings.initialValues = this.form.data;
      } else if (isObject(this.formData)) {
        this.ReactJsonSchemaFormCompatibility = true;
        formSettings.initialValues = this.formData;
      } else if (hasOwn(this.form, 'formData') && isObject(this.form.formData)) {
        this.ReactJsonSchemaFormCompatibility = true;
        formSettings.initialValues = this.form.formData;
      }

      if (!isEmpty(formSettings.schema)) {

        // Build the Angular 2 FormGroup template from the schema
        formSettings.formGroupTemplate = buildFormGroupTemplate(
          formSettings, '', '', '', true, formSettings.initialValues
        );

      } else {

        // TODO: (?) If the schema does not exist,
        // build the Angular 2 FormGroup template from the layout instead
        // this.formGroupTemplate =
        //   this.buildFormGroupTemplateFromLayout(formSettings.layout, formSettings);
      }

      // Update all layout elements, set values, and add validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      formSettings.layout = buildLayout(formSettings);

      // Build the real Angular 2 FormGroup from the FormGroup template
      formSettings.formGroup = <FormGroup>buildFormGroup(formSettings.formGroupTemplate);

      if (formSettings.formGroup) {

        // Display the template to render form
        this.formInitialized = true;

        // Subscribe to form value changes to output live data, validation, and errors
        formSettings.formGroup.valueChanges.subscribe(
          value => {
            const formattedData = formatFormData(value, formSettings);
            this.onChanges.emit(formattedData); // Formatted output
            // this.onChanges.emit(value); // Non-formatted output
            const isValid = this.validateFormData(formattedData);
            this.isValid.emit(isValid);
            this.validationErrors.emit(this.validateFormData.errors);
          }
        );

        // Output initial data
        this.onChanges.emit(formatFormData(formSettings.formGroup.value, formSettings));

        // If 'validateOnRender' = true, output initial validation and any errors
        if (formSettings.globalOptions.validateOnRender) {
          const isValid =
            this.validateFormData(formatFormData(formSettings.formGroup.value, formSettings));
          this.isValid.emit(isValid);
          this.validationErrors.emit(this.validateFormData.errors);
        }
// console.log(formSettings.formGroupTemplate);
// console.log(formSettings.templateRefLibrary);
// console.log(formSettings.layoutRefLibrary);
console.log(formSettings.layout);
      } else {
        // TODO: Output error message
      }
    }
  }

  // Output debugging information
  ngDoCheck() {
    if (this.debug) {
      const vars: any[] = [];
      // vars.push(this.formSettings.schema);
      // vars.push(this.formSettings.dataMap);
      // vars.push(this.formSettings.arrayMap);
      // vars.push(this.formSettings.formGroupTemplate);
      vars.push(this.formSettings.layout);
      // vars.push(this.formSettings.schemaRefLibrary);
      // vars.push(this.formSettings.initialValues);
      // vars.push(this.formSettings.formGroup);
      // vars.push(this.formSettings.formGroup.value);
      // vars.push(this.formSettings.layoutRefLibrary);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  private submitForm() {
    this.onSubmit.emit(formatFormData(this.formSettings.formGroup.value, this.formSettings, true));
  }
}
