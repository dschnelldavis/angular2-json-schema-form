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
import { buildFormGroupTemplate, buildFormGroup } from './utilities/form-builder-functions';
import {
  forOwnDeep, formatFormData, getInputType, isInputRequired, mapLayout, toTitleCase
} from './utilities/utility-functions';
import {
  hasOwn, inArray, isArray, isBlank, isEmpty, isFunction, isInteger,
  isNumber, isObject, isPresent, isSet, isString,
  toJavaScriptType, toSchemaType, SchemaPrimitiveType,
} from './utilities/validator-functions';
import { convertJsonSchema3to4 } from './utilities/convert-json-schema';
import { JsonPointer } from './utilities/jsonpointer';
import { JsonValidators } from './utilities/json-validators';

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
    <root-widget
      *ngIf="formActive"
      [layoutNode]="rootLayout"
      [formGroup]="rootFormGroup"
      [formOptions]="formOptions"
      [debug]="debug">
    </root-widget>
  </form>
  <div *ngIf="debug">
    Debug output:
    <pre>{{debugOutput}}</pre>
  </div>`,
})
export class JsonSchemaFormComponent implements AfterContentInit, AfterViewInit, DoCheck, OnChanges, OnInit {
  private formActive: boolean = false; // Used to trigger form rendering
  private rootSchema: any = {}; // The internal JSON Schema
  private rootLayout: any[] = []; // The internal Form layout
  private rootData: any = {}; // The internal Data model (e.g. previously submitted data)
  private schemaRefLibrary: any = {}; // Library of references for schema $refs
  private fieldMap: any = {}; // Links schema, layout, formGroup template, and data
  private rootFormGroupTemplate: any = {}; // Template used to create formGroup
  private rootFormGroup: FormGroup; // Angular 2 formGroup, for powering reactive form
  private ajv: any = new Ajv({ allErrors: true }); // AJV JSON Schema validator
  private validateFormData: any = null; // Compiled AJV to validate this form's schema
  private debugOutput: any; // Debug information
  private formOptions: any = {
    supressPropertyTitles: false,
    formDefaults: { notitle: false, readonly: false, feedback: true, },
    validationMessage: {},
    setSchemaDefaults: true,
    pristine: { errors: true, success: true },
    validateOnRender: false,
    framework: null,
    fieldsRequired: false,
    references: {}, // references for dynamic arrays and circular schema $refs
  }; // Global optiona for form

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
  @ViewChild('jsonform', { read: ViewContainerRef })
    private jsonformContainer: ViewContainerRef;

  constructor(
    private formBuilder: FormBuilder,
    private http: Http,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainer: ViewContainerRef,
    private widgetLibrary: WidgetLibraryService,
    private frameworkLibrary: FrameworkLibraryService,
    // private validatorLibrary: ValidatorLibraryService,
  ) {
    this.rootFormGroup = this.formBuilder.group({});
  }

  ngOnInit() {
    if (isObject(this.options)) Object.assign(this.formOptions, this.options);
    this.formOptions.framework = this.frameworkLibrary.getFramework();
  }

  ngAfterContentInit() {
  }

  ngAfterViewInit() {
  }

  ngOnChanges() {
    this.buildFormInputs();
  }

  /**
   * 'buildFormInputs' function
   *
   * - Update 'rootSchema', 'rootLayout', and 'rootData',
   *   the inputs used to construct the form.
   *
   * - Create 'fieldMap' to map the relationships between the schema and layout.
   *
   * - Create 'schemaRefLibrary' to resolve schema $ref links.
   *
   * - Create 'formOptions.references' to add components to arrays and
   *   circular $ref points in the form.
   *
   * - Create 'rootFormGroupTemplate', then from it 'rootFormGroup',
   *   the Angular 2 formGroup used to control the reactive form.
   *
   * @return {void}
   */
  buildFormInputs() {
    if (
      this.form || this.layout || this.schema || this.data ||
      this.model || this.JSONSchema || this.UISchema || this.formData
    ) {
      this.formActive = false;
      this.rootSchema = {};
      this.rootLayout = [];
      this.rootData = {};
      this.fieldMap = {};
      this.schemaRefLibrary = {};
      this.formOptions.references = {};
      this.rootFormGroupTemplate = {};
      this.rootFormGroup = this.formBuilder.group({});

      // Initialize 'rootSchema'
      // Use first available input:
      // 1. schema - recommended / Angular Schema Form style
      // 2. form.schema - Single input / JSON Form style
      // 3. JSONSchema - React JSON Schema Form style
      // 4. form.JSONSchema - For testing single input React JSON Schema Forms
      // 5. form - For easier testing
      // 6. (none) no schema - construct form entirely from layout instead
      if (isObject(this.schema)) {
        this.rootSchema = this.schema;
      } else if (hasOwn(this.form, 'schema') &&
        isObject(this.form.schema)) {
        this.rootSchema = this.form.schema;
      } else if (isObject(this.JSONSchema)) {
        this.rootSchema = this.JSONSchema;
      } else if (hasOwn(this.form, 'JSONSchema') &&
      isObject(this.form.JSONSchema)) {
        this.rootSchema = this.form.JSONSchema;
      } else if (hasOwn(this.form, 'properties') &&
        isObject(this.form.properties)) {
        this.rootSchema = this.form;
      }

      if (!isEmpty(this.rootSchema)) {

        // Allow for JSON schema shorthand (JSON Form style)
        if (!hasOwn(this.rootSchema, 'type') &&
          hasOwn(this.rootSchema, 'properties') &&
          isObject(this.rootSchema.properties)
        ) {
          this.rootSchema.type = 'object';
        } else if (!hasOwn(this.rootSchema, 'type') ||
          this.rootSchema.type !== 'object' ||
          !hasOwn(this.rootSchema, 'properties')
        ) {
          this.rootSchema = { 'type': 'object', 'properties': this.rootSchema };
        }

        // If JSON Schema is version 3 (JSON Form style), convert to version 4
        this.rootSchema = convertJsonSchema3to4(this.rootSchema);

        // Initialize ajv and compile schema
        this.validateFormData = this.ajv.compile(this.rootSchema);

        // Resolve Schema $ref links, and save them in schemaRefLibrary
        forOwnDeep(this.rootSchema, (value, key, ignore, pointer) => {
          if (hasOwn(value, '$ref') && isString(value['$ref'])) {
            let newReference: string = JsonPointer.compile(value['$ref']);
            let isCircular = JsonPointer.isSubPointer(newReference, pointer);
            if (!hasOwn(this.schemaRefLibrary, newReference) && newReference !== '') {
              this.schemaRefLibrary[newReference] = JsonPointer.getSchemaReference(
                this.rootSchema, newReference, this.schemaRefLibrary
              );
            }
            // if $ref link is not circular, remove it and replace it
            // with a copy of the schema it linked to
            if (!isCircular) {
              delete value['$ref'];
              JsonPointer.set(this.rootSchema, pointer, Object.assign(
                {}, _.cloneDeep(this.schemaRefLibrary[newReference]), value
              ));
            }
          }
        }, this.rootSchema, '', true);
      }

      // Initialize 'rootLayout'
      // Use first available array input:
      // 1. layout - recommended
      // 2. form - Angular Schema Form style
      // 3. form.form - JSON Form style
      // 4. form.layout - Single input style
      // 5. (none) no input - set default layout instead
      if (isArray(this.layout)) {
        this.rootLayout = this.layout;
      } else if (isArray(this.form)) {
        this.rootLayout = this.form;
      } else if (isArray(this.form.form)) {
        this.rootLayout = this.form.form;
      } else if (isArray(this.form.layout)) {
        this.rootLayout = this.form.layout;
      } else {
        this.rootLayout = [ '*', { type: 'submit', title: 'Submit' } ];
      }

      // If using React JSON Schema Form API compatibility,
      // initialize alternate layout format 'UISchema'
      // Use first available input:
      // 1. UISchema - React JSON Schema Form style
      // 2. form.UISchema - For testing single input React JSON Schema Forms
      // 3. (none) no input - don't use UISchema
      if (isObject(this.UISchema) || hasOwn(this.form, 'UISchema')) {
        let UISchema = this.UISchema || this.form.UISchema;
        // if UISchema found, copy UISchema items into rootSchema
        forOwnDeep(UISchema, (value, key, ignore, pointer) => {
          let schemaPointer = '/properties' + pointer;
          if (!JsonPointer.has(this.rootSchema, schemaPointer)) {
            JsonPointer.set(this.rootSchema, schemaPointer, value);
          }
        });
      }

      // Initialize 'rootData'
      // Use first available input:
      // 1. data - recommended
      // 2. model - Angular Schema Form style
      // 3. form.value - JSON Form style
      // 4. form.data - Single input style
      // 5. formData - React JSON Schema Form style
      // 6. form.formData - For easier testing of React JSON Schema Forms
      // 7. (none) no data - use schema and layout defaults to initialize form
      if (isObject(this.data)) {
        this.rootData = this.data;
      } else if (isObject(this.model)) {
        this.rootData = this.model;
      } else if (isObject(this.form) &&
        isObject(this.form.value)) {
        this.rootData = this.form.value;
      } else if (isObject(this.form) &&
        isObject(this.form.data)) {
        this.rootData = this.form.data;
      } else if (isObject(this.formData)) {
        this.rootData = this.formData;
      } else if (hasOwn(this.form, 'formData') &&
        isObject(this.form.formData)) {
        this.rootData = this.form.formData;
      }

      if (!isEmpty(this.rootSchema)) {

        // Build the Angular 2 FormGroup template from the schema
        this.rootFormGroupTemplate = buildFormGroupTemplate(
          this.rootSchema, this.formOptions.references, this.fieldMap
        );
      } else {

        // TODO: If the schema does not exist,
        // build the Angular 2 FormGroup template from the layout instead
        // this.rootFormGroupTemplate =
        //   this.buildFormGroupTemplateFromLayout(this.rootLayout, this.fieldMap);
      }

      // Update all layout elements, set values, and add validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      // TODO: Update layout and Angular 2 FormGroup template from data
      // (set default values and extend arrays)
      this.rootLayout = this.buildLayout(
        this.rootLayout, this.rootSchema, this.rootData,
        this.schemaRefLibrary, this.formOptions.references, this.fieldMap
      );

      // Build the real Angular 2 FormGroup from the FormGroup template
      this.rootFormGroup = <FormGroup>(buildFormGroup(
        this.rootFormGroupTemplate
      ));

      if (this.rootFormGroup) {

        // Activate the *ngIf in the template to render form
        this.formActive = true;

        // Subscribe to form value changes to output live data, validation, and errors
        this.rootFormGroup.valueChanges.subscribe(
          value => {
            let formattedData = formatFormData(value, this.fieldMap);
            this.onChanges.emit(formattedData);
            // this.onChanges.emit(value);
            let isValid = this.validateFormData(formattedData);
            this.isValid.emit(isValid);
            this.validationErrors.emit(this.validateFormData.errors);
          }
        );

        // Output initial data
        this.onChanges.emit(formatFormData(this.rootFormGroup.value, this.fieldMap));

        // If 'validateOnRender' = true, output initial validation and any errors
        if (this.formOptions.validateOnRender) {
          let isValid = this.validateFormData(formatFormData(this.rootFormGroup.value, this.fieldMap));
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
      let vars: any[] = [];
      // vars.push(this.rootSchema);
      vars.push(this.rootFormGroupTemplate);
      vars.push(this.fieldMap);
      // vars.push(this.rootLayout);
      // vars.push(this.schemaRefLibrary);
      // vars.push(this.rootData);
      // vars.push(this.rootFormGroup);
      // vars.push(this.rootFormGroup.value);
      // vars.push(this.formOptions.references);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  /**
   * 'buildLayout' function
   *
   * @param {any[]} layout -
   * @param {any} schema -
   * @param {any} data -
   * @param {any} formReferences -
   * @param {any} fieldMap -
   * @return {any[]} -
   */
  private buildLayout(
    layout: any[], schema: any, data: any, schemaRefLibrary: any,
    formReferences: any, fieldMap: any
  ): any[] {
    return mapLayout(layout, (layoutItem, index, ignore, layoutPointer) => {
      let newItem: any = {};
      if (this.formOptions.setSchemaDefaults) {
        Object.assign(newItem, _.cloneDeep(this.formOptions.formDefaults));
      }
      if (isObject(layoutItem)) {
        Object.assign(newItem, layoutItem);
      } else if (JsonPointer.isJsonPointer(layoutItem)) {
        newItem.pointer = layoutItem;
      } else if (isString(layoutItem)) {
        newItem.key = layoutItem;
      } else {
        console.error('Form layout element not recognized:');
        console.error(layoutItem);
        return null;
      }
      let itemSchema: any = null;
      let schemaDefaultValue: any = null;
      if (hasOwn(newItem, 'key') || hasOwn(newItem, 'pointer')) {
        if (newItem.key === '*' || newItem.pointer === '*') {
          return this.buildLayoutFromSchema(
            schema, data, schemaRefLibrary, formReferences, fieldMap
          );
        }
        if (JsonPointer.isJsonPointer(newItem.key)) {
          newItem.pointer = JsonPointer.compile(newItem.key);
        } else {
          newItem.pointer =
            JsonPointer.compile(JsonPointer.parseObjectPath(newItem.key), '-');
        }
        newItem.name = JsonPointer.toKey(newItem.pointer);
        if (!hasOwn(fieldMap, newItem.pointer)) fieldMap[newItem.pointer] = {};
        if (hasOwn(fieldMap[newItem.pointer], 'schemaPointer')) {
          itemSchema = JsonPointer.get(schema, fieldMap[newItem.pointer]['schemaPointer']);
        } else {
          itemSchema = JsonPointer.getFromSchema(schema, newItem.pointer);
          // TODO: add schemaPointer to fieldMap
          // fieldMap[newItem.pointer]['schemaPointer'] = ;
        }
        if (itemSchema) {
          // newItem.schema = itemSchema;
          if (!hasOwn(newItem, 'type')) {
            newItem.type = getInputType(itemSchema);
          }
          if (!hasOwn(newItem, 'dataType')) {
            newItem.dataType = itemSchema.type;
          }
          this.updateInputOptions(newItem, itemSchema, data);
          if (newItem.type === 'checkboxes' && hasOwn(itemSchema, 'items')) {
            this.updateInputOptions(newItem, itemSchema.items, data);
          }
          if (!newItem.title && !isNumber(newItem.name)) {
            newItem.title = newItem.name.charAt(0).toUpperCase() + newItem.name.slice(1);
          }
          if (isInputRequired(schema, newItem.pointer)) {
            this.formOptions.fieldsRequired = true;
            newItem.required = true;
          }
          schemaDefaultValue = itemSchema.default;
        } else {
          // TODO: create item in FormGroup model from layout key
        }
        newItem.widget = this.widgetLibrary.getWidget(newItem.type);
        fieldMap[newItem.pointer]['inputType'] = newItem.type;
        fieldMap[newItem.pointer]['widget'] = newItem.widget;
        if (newItem.type === 'array' && hasOwn(newItem, 'items')) {
          let arrayPointer: string = newItem.pointer + '/-';
          if (!hasOwn(fieldMap, arrayPointer)) fieldMap[arrayPointer] = {};
          fieldMap[arrayPointer]['inputType'] = 'section';
          let arrayItemGroup = [];
          let length: number = arrayPointer.length;
          let itemPointer: string = newItem.pointer + '/0';
          for (let i = newItem.items.length - 1, l = 0; i >= l; i--) {
            let subItem = newItem.items[i];
            if (subItem.pointer.slice(0, length) === arrayPointer) {
              subItem.pointer = itemPointer + subItem.pointer.slice(length);
              arrayItemGroup.unshift(newItem.items.pop());
            }
          }
          if (arrayItemGroup.length) {
            let newItemFieldset: any = {
              'type': 'fieldset',
              'pointer': itemPointer,
              'items': arrayItemGroup,
              'widget': this.widgetLibrary.getWidget('fieldset')
            };
            newItem.items.push(newItemFieldset);
            let newItemRef: any = {
              'type': '$ref', '$ref': arrayPointer, '$refType': 'array'
            };
            if (hasOwn(newItem, 'add') && isString(newItem.add)) {
              newItemRef.title = newItem.add;
              delete newItem.add;
            };
            if (hasOwn(newItem, 'style') && hasOwn(newItem.style, 'add')) {
              newItemRef.style = newItem.style.add;
              delete newItem.style.add;
              if (isEmpty(newItem.style)) delete newItem.style;
            };
            newItem.items.push(newItemRef);
            formReferences[arrayPointer] = {
              'layout': newItemFieldset, '$refType': 'array'
            };
          }
        }
      } else if (hasOwn(newItem, 'type')) {
        newItem.widget = this.widgetLibrary.getWidget(newItem.type);
      }
      return newItem;
    });
  }

  /**
   * 'buildLayoutFromSchema' function
   *
   * @param {any} schema -
   * @param {any} data -
   * @param {any} formReferences -
   * @param {any} fieldMap -
   * @param {number = 0} layoutIndex -
   * @param {any = schema} rootSchema -
   * @param {string = ''} schemaPointer -
   * @param {string = ''} layoutPointer -
   * @param {string = ''} dataPointer -
   * @return {any} -
   */
  private buildLayoutFromSchema(
    schema: any, data: any, schemaRefLibrary: any, formReferences: any, fieldMap: any,
    layoutIndex: number = 0, rootSchema: any = schema, schemaPointer: string = '',
    layoutPointer: string = '', dataPointer: string = ''
  ): any {
    if (!hasOwn(schema, 'type') && !hasOwn(schema, 'x-schema-form')) return null;
    let newItem: any = {};
    if (this.formOptions.setSchemaDefaults) {
      Object.assign(newItem, _.cloneDeep(this.formOptions.formDefaults));
    }
    if (hasOwn(schema, 'x-schema-form')) {
      Object.assign(newItem, schema['x-schema-form']);
    }
    newItem.pointer = dataPointer;
    newItem.name = JsonPointer.toKey(newItem.pointer);
    newItem.type = getInputType(schema);
    newItem.dataType = schema.type;
    newItem.widget = this.widgetLibrary.getWidget(newItem.type);
    if (dataPointer !== '') {
      if (!hasOwn(fieldMap, newItem.pointer)) fieldMap[newItem.pointer] = {};
      fieldMap[newItem.pointer]['schemaPointer'] = schemaPointer;
      fieldMap[newItem.pointer]['inputType'] = newItem.type;
      fieldMap[newItem.pointer]['widget'] = newItem.widget;
    }
    this.updateInputOptions(newItem, schema, data);
    if (!newItem.title && !isNumber(newItem.name)) {
      newItem.title = newItem.name.charAt(0).toUpperCase() + newItem.name.slice(1);
    }
    switch (newItem.type) {
      case 'fieldset':
        let newFieldset: any[] = [];
        let index: number = dataPointer === '' ? layoutIndex : 0;
        let newKeys: string[];
        let subObject: string = 'properties';
        if (hasOwn(schema, 'properties')) {
          if (hasOwn(schema.properties, 'ui:order')) {
            newKeys = schema['properties']['ui:order'];
          } else {
            newKeys = Object.keys(schema['properties']);
          }
        } else if (hasOwn(schema, 'additionalProperties')) {
          subObject = 'additionalProperties';
          newKeys = Object.keys(schema['additionalProperties']);
        }
        for (let i = 0, l = newKeys.length; i < l; i++) {
          let key = newKeys[i];
          if (hasOwn(schema[subObject], key)) {
            let item = schema[subObject][key];
            let innerItem = this.buildLayoutFromSchema(
              item, data, schemaRefLibrary, formReferences, fieldMap, index, rootSchema,
              schemaPointer + '/properties/' + key,
              layoutPointer + '/' + index,
              dataPointer + '/' + key
            );
            if (innerItem) {
              if (isInputRequired(schema, '/' + key)) {
                this.formOptions.fieldsRequired = true;
                innerItem.required = true;
              }
              newFieldset.push(innerItem);
              index++;
            }
          }
        }
        if (dataPointer === '') {
          newItem = newFieldset;
        } else {
          newItem.items = newFieldset;
        }
      break;
      case 'array':
        let additionalItems: any = null;
        if (isArray(schema.items)) {
          newItem.items = _.filter(_.map(schema.items, (item, index) =>
            this.buildLayoutFromSchema(
              item, data, schemaRefLibrary, formReferences,
              fieldMap, index, rootSchema,
              schemaPointer + '/items/' + index,
              layoutPointer + '/items/' + index,
              dataPointer + '/' + index
            )
          ));
          if (hasOwn(schema, 'additionalItems') && schema.additionalItems !== false) {
            additionalItems = this.buildLayoutFromSchema(
              schema.additionalItems, data, schemaRefLibrary, formReferences,
              fieldMap, newItem.length, rootSchema,
              schemaPointer + '/items/' + newItem.length,
              layoutPointer + '/items/' + newItem.length,
              dataPointer + '/' + newItem.length
            );
            if (additionalItems) newItem.items.push(additionalItems);
          }
        } else {
          additionalItems = this.buildLayoutFromSchema(
            schema.items, data, schemaRefLibrary, formReferences,
            fieldMap, 0, rootSchema,
            schemaPointer + '/items/0',
            layoutPointer + '/items/0',
            dataPointer + '/0'
          );
          newItem.items = [additionalItems];
        }
        if (additionalItems) {
          formReferences[dataPointer + '/-'] = { // Create $ref for additinal items
            'layout': additionalItems, '$refType': 'array'
          };
          delete formReferences[dataPointer + '/-']['layout']['key'];
          delete formReferences[dataPointer + '/-']['layout']['name'];
          newItem.items.push({ // add $ref item to array to create 'add new' button
            'type': '$ref', '$ref': dataPointer + '/-', '$refType': 'array'
          });
        }
      break;
    }
    return newItem;
  }

  /**
   * 'updateInputOptions' function
   *
   * @param {any} layout
   * @param {any} schema
   * @return {void}
   */
  private updateInputOptions(layout: any, schema: any, data: any) {
    let type: string[] = (isPresent(layout.type) && isArray(layout.type)) ?
      <string[]>layout.type : [<string>layout.type];
    let optionsToUpdate: string[] = [
      'title', 'notitle', 'disabled', 'description', 'validationMessage',
      'onChange', 'feedback', 'disableSuccessState', 'disableErrorState',
      'placeholder', 'ngModelOptions', 'readonly', 'copyValueTo', 'condition',
      'destroyStrategy', 'htmlClass', 'fieldHtmlClass', 'labelHtmlClass', 'enum',
      'ui:rootFieldId', 'ui:help', 'ui:disabled', 'ui:readonly', 'ui:placeholder',
      'ui:autofocus', 'ui:options', // 'ui:order', 'classNames', 'label',
      // 'errors', 'help', 'hidden', 'required', 'displayLabel',
    ];
    if (inArray(['text', 'textarea', 'search'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate.concat('minLength', 'maxLength', 'pattern');
    }
    if (inArray(['text', 'textarea', 'search', 'email', 'url', 'date', 'datetime',
      'date-time', 'datetime-local'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate.concat('format');
    }
    if (inArray(['date', 'datetime', 'date-time', 'datetime-local',
      'number', 'integer', 'range'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate.concat('minimum', 'maximum');
    }
    if (inArray(['number', 'integer', 'range'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate
        .concat('exclusiveMinimum', 'exclusiveMaximum', 'multipleOf');
    }
    if (inArray('fieldset', type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate
        .concat('minProperties', 'maxProperties', 'dependencies');
    }
    if (inArray(['array', 'checkboxes'], type) || isBlank(type)) {
      optionsToUpdate = optionsToUpdate
        .concat('minItems', 'maxItems', 'uniqueItems');
    }
    _.forEach(optionsToUpdate, option => {

      // If a new validator is needed in template, set it
      if (hasOwn(layout, option) && isFunction(JsonValidators[option]) && (
        !hasOwn(schema, option) || (schema[option] !== layout[option] &&
          !(option.slice(0, 3) === 'min' && schema[option] < layout[option]) &&
          !(option.slice(0, 3) === 'max' && schema[option] > layout[option])
        )
      )) {
         JsonPointer.set(
           this.rootFormGroupTemplate,
           this.fieldMap[layout.pointer]['templatePointer'] + '/validators/' + option,
           [layout[option]]
         );
      }

      // Check for option value, and set in layout
      let newValue: any = JsonPointer.getFirst([
        [ layout, [option] ],
        [ schema, ['x-schema-form', option] ],
        [ schema, [option]],
        [ this.formOptions, ['formDefaults', option] ]
      ]);
      if (isPresent(newValue)) {
        if (option.slice(0, 3) === 'ui:') {
          layout[option.slice(3)] = newValue;
        } else {
          layout[option] = newValue;
        }
      }
    });

    // If schema type is integer, enforce by setting multipleOf = 1
    if (inArray(schema.type, ['integer']) && !hasOwn(layout, 'multipleOf')) {
      layout.multipleOf = 1;

    // If schema type is array, set controlTemplate in layout
    // TODO: fix to set controlTemplate for all layout $ref links instead
    } else if (schema.type === 'array') {
      layout.controlTemplate = JsonPointer.get(this.rootFormGroupTemplate,
        this.fieldMap[layout.pointer]['templatePointer'] + '/controls/-');
    }

    // Check for initial or default field value, and set in both layout and template
    if (layout.pointer) {
      let newValue: any = JsonPointer.getFirst([
        [ data, layout.pointer ],
        [ layout, '/value' ],
        [ layout, '/default' ],
        [ schema, '/default' ]
      ]);
      if (isSet(newValue)) {
        layout.value = newValue;
        JsonPointer.set(
          this.rootFormGroupTemplate,
          this.fieldMap[layout.pointer]['templatePointer'] + '/value',
          newValue
        );
      }
    }
  }

  private submitForm() {
    this.onSubmit.emit(formatFormData(this.rootFormGroup.value, this.fieldMap, true));
  }
}
