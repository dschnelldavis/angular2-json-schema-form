import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges,
  OnInit
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import * as _ from 'lodash';

import { FrameworkLibraryService } from './framework-library/framework-library.service';
import { WidgetLibraryService } from './widget-library/widget-library.service';
import { JsonSchemaFormService } from './json-schema-form.service';
import { convertSchemaToDraft6 } from './shared/convert-schema-to-draft6.function';
import { resolveSchemaReferences } from './shared/json-schema.functions';
import { hasValue, isArray, isEmpty, isObject } from './shared/validator.functions';
import { forEach, hasOwn } from './shared/utility.functions';
import { JsonPointer } from './shared/jsonpointer.functions';

/**
 * @module 'JsonSchemaFormComponent' - Angular JSON Schema Form
 *
 * Root module of the Angular JSON Schema Form client-side library,
 * an Angular library which generates an HTML form from a JSON schema
 * structured data model and/or a JSON Schema Form layout description.
 *
 * This library also validates input data by the user, using both validators on
 * individual controls to provide real-time feedback while the user is filling
 * out the form, and then validating the entire input against the schema when
 * the form is submitted to make sure the returned JSON data object is valid.
 *
 * This library is similar to, and mostly API compatible with:
 *
 * - JSON Schema Form's Angular Schema Form library for AngularJs
 *   http://schemaform.io
 *   http://schemaform.io/examples/bootstrap-example.html (examples)
 *
 * - Mozilla's react-jsonschema-form library for React
 *   https://github.com/mozilla-services/react-jsonschema-form
 *   https://mozilla-services.github.io/react-jsonschema-form (examples)
 *
 * - Joshfire's JSON Form library for jQuery
 *   https://github.com/joshfire/jsonform
 *   http://ulion.github.io/jsonform/playground (examples)
 *
 * This library depends on:
 *  - Angular (obviously)                  https://angular.io
 *  - lodash, JavaScript utility library   https://github.com/lodash/lodash
 *  - ajv, Another JSON Schema validator   https://github.com/epoberezkin/ajv
 *
 * In addition, the Example Playground also depends on:
 *  - brace, Browserified Ace editor       http://thlorenz.github.io/brace
 */
@Component({
  selector: 'json-schema-form',
  template: `
    <div *ngFor="let stylesheet of stylesheets">
      <link rel="stylesheet" [href]="stylesheet">
    </div>
    <div *ngFor="let script of scripts">
      <script type="text/javascript" [src]="script"></script>
    </div>
    <form class="json-schema-form" (ngSubmit)="submitForm()">
      <root-widget
        [formID]="formID"
        [layout]="jsfObject.layout"
        [data]="jsfObject.data"></root-widget>
    </form>
    <div *ngIf="debug || jsfObject.globalOptions.debug">
      Debug output: <pre>{{debugOutput}}</pre>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaFormComponent implements OnChanges, OnInit {
  formID: number; // Unique ID for displayed form
  debugOutput: any; // Debug information, if requested
  formValueSubscription: any = null;
  jsfObject: any;

  // Recommended inputs
  @Input() schema: any; // The JSON Schema
  @Input() layout: any[]; // The form layout
  @Input() data: any; // The data model
  @Input() options: any; // The global form options
  @Input() framework: string; // The framework to load
  @Input() widgets: string; // Any custom widgets to load

  // Alternate combined single input
  @Input() form: any; // For testing, and JSON Schema Form API compatibility

  // Angular Schema Form API compatibility inputs
  @Input() model: any; // Alternate input for data model

  // React JSON Schema Form API compatibility inputs
  @Input() JSONSchema: any; // Alternate input for JSON Schema
  @Input() UISchema: any; // UI schema - alternate form layout format
  @Input() formData: any; // Alternate input for data model

  // Development inputs, for testing and debugging
  @Input() loadExternalAssets: boolean; // Load external framework assets?
  @Input() debug: boolean; // Show debug information?

  // Outputs
  @Output() onChanges = new EventEmitter<any>(); // Live unvalidated internal form data
  @Output() onSubmit = new EventEmitter<any>(); // Complete validated form data
  @Output() isValid = new EventEmitter<boolean>(); // Is current data valid?
  @Output() validationErrors = new EventEmitter<any>(); // Validation errors (if any)
  @Output() formSchema = new EventEmitter<any>(); // Final schema used to create form
  @Output() formLayout = new EventEmitter<any>(); // Final layout used to create form

  constructor(
    private frameworkLibrary: FrameworkLibraryService,
    private widgetLibrary: WidgetLibraryService,
    private jsf: JsonSchemaFormService,
    private sanitizer: DomSanitizer
  ) {
    this.jsfObject = jsf;
  }

  ngOnInit() { }

  ngOnChanges() {
    this.initializeForm();
  }

  get stylesheets(): SafeResourceUrl[] {
    const load = this.sanitizer.bypassSecurityTrustResourceUrl;
    return this.frameworkLibrary.getFrameworkStylesheets()
      .map(stylesheet => load(stylesheet));
  }

  get scripts(): SafeResourceUrl[] {
    const load = this.sanitizer.bypassSecurityTrustResourceUrl;
    return this.frameworkLibrary.getFrameworkScripts()
      .map(script => load(script));
  }

  submitForm() {
    this.onSubmit.emit(this.jsf.validData);
  }

  /**
   * 'initializeForm' function
   *
   * - Update 'schema', 'layout', and 'initialValues', from inputs.
   *
   * - Create 'schemaRefLibrary' and 'schemaRecursiveRefMap'
   *   to resolve schema $ref links, including recursive $ref links.
   *
   * - Create 'dataRecursiveRefMap' to resolve recursive links in data
   *   and corectly set output formats for recursively nested values.
   *
   * - Create 'layoutRefLibrary' and 'templateRefLibrary' to store
   *   new layout nodes and formGroup elements to use when dynamically
   *   adding form components to arrays and recursive $ref points.
   *
   * - Create 'dataMap' to map the data to the schema and template.
   *
   * - Create the master 'formGroupTemplate' then from it 'formGroup'
   *   the Angular formGroup used to control the reactive form.
   *
   * @return {void}
   */
  initializeForm(): void {
    if (this.schema || this.layout || this.data || this.form || this.JSONSchema || this.UISchema) {

      this.jsf.resetAllValues();  // Reset all form values to defaults
      this.initializeOptions();   // Update options
      this.initializeSchema();    // Update schema, schemaRefLibrary,
                                  // schemaRecursiveRefMap, & dataRecursiveRefMap
      this.initializeLayout();    // Update layout, layoutRefLibrary,
      this.initializeData();      // Update initialValues
      this.activateForm();        // Update dataMap, templateRefLibrary,
                                  // formGroupTemplate, formGroup

      // Uncomment individual lines to output debugging information to browser:
      // (These only work if the 'debug' option has also been set to 'true'.)
      if (this.debug || this.jsf.globalOptions.debug) {
        const vars: any[] = [];
        // vars.push(this.jsf.schema);
        // vars.push(this.jsf.layout);
        // vars.push(this.options);
        // vars.push(this.jsf.initialValues);
        // vars.push(this.jsf.formGroup.value);
        // vars.push(this.jsf.formGroupTemplate);
        // vars.push(this.jsf.formGroup);
        // vars.push(this.jsf.schemaRefLibrary);
        // vars.push(this.jsf.layoutRefLibrary);
        // vars.push(this.jsf.templateRefLibrary);
        // vars.push(this.jsf.dataMap);
        // vars.push(this.jsf.arrayMap);
        // vars.push(this.jsf.schemaRecursiveRefMap);
        // vars.push(this.jsf.dataRecursiveRefMap);
        this.debugOutput = vars.map(v => JSON.stringify(v, null, 2)).join('\n');
      }

      // Uncomment individual lines to output debugging information to console:
      // (These always work.)
      // console.log('loading form...');
      // console.log('schema', this.jsf.schema);
      // console.log('layout', this.jsf.layout);
      // console.log('options', this.options);
      // console.log('initialValues', this.jsf.initialValues);
      // console.log('formGroupTemplate', this.jsf.formGroupTemplate);
      // console.log('formGroup', this.jsf.formGroup);
      // console.log('formGroup.value', this.jsf.formGroup.value);
      // console.log('schemaRefLibrary', this.jsf.schemaRefLibrary);
      // console.log('layoutRefLibrary', this.jsf.layoutRefLibrary);
      // console.log('templateRefLibrary', this.jsf.templateRefLibrary);
      // console.log('dataMap', this.jsf.dataMap);
      // console.log('arrayMap', this.jsf.arrayMap);
      // console.log('schemaRecursiveRefMap', this.jsf.schemaRecursiveRefMap);
      // console.log('dataRecursiveRefMap', this.jsf.dataRecursiveRefMap);
    }
  }

  /**
   * 'initializeOptions' function
   *
   * Initialize 'options' (global form options) and set framework
   * Combine available inputs:
   * 1. options - recommended
   * 2. form.options - Single input style
   */
  private initializeOptions() {
    this.jsf.setOptions({ debug: !!this.debug });
    let loadExternalAssets: boolean = this.loadExternalAssets || false;
    let framework: any = this.framework || 'default';
    if (isObject(this.options)) {
      this.jsf.setOptions(this.options);
      loadExternalAssets = this.options.loadExternalAssets || loadExternalAssets;
      framework = this.options.framework || framework;
    }
    if (isObject(this.form) && isObject(this.form.options)) {
      this.jsf.setOptions(this.form.options);
      loadExternalAssets = this.form.options.loadExternalAssets || loadExternalAssets;
      framework = this.form.options.framework || framework;
    }
    if (isObject(this.widgets)) {
      this.jsf.setOptions({ widgets: this.widgets });
    }
    this.frameworkLibrary.setLoadExternalAssets(loadExternalAssets);
    this.frameworkLibrary.setFramework(framework);
    this.jsf.framework = this.frameworkLibrary.getFramework();
    if (isObject(this.jsf.globalOptions.widgets)) {
      for (let widget of Object.keys(this.jsf.globalOptions.widgets)) {
        this.widgetLibrary.registerWidget(widget, this.jsf.globalOptions.widgets[widget]);
      }
    }
    if (isObject(this.form) && isObject(this.form.tpldata)) {
      this.jsf.setTpldata(this.form.tpldata);
    }
  }

  /**
   * 'initializeSchema' function
   *
   * Initialize 'schema'
   * Use first available input:
   * 1. schema - recommended / Angular Schema Form style
   * 2. form.schema - Single input / JSON Form style
   * 3. JSONSchema - React JSON Schema Form style
   * 4. form.JSONSchema - For testing single input React JSON Schema Forms
   * 5. form - For testing single schema-only inputs
   *
   * ... if no schema input found, the 'activateForm' function, below,
   *     will make two additional attempts to build a schema
   * 6. If layout input - build schema from layout
   * 7. If data input - build schema from data
   */
  private initializeSchema() {

    // TODO: update to allow non-object schemas

    if (isObject(this.schema)) {
      this.jsf.AngularSchemaFormCompatibility = true;
      this.jsf.schema = _.cloneDeep(this.schema);
    } else if (hasOwn(this.form, 'schema') && isObject(this.form.schema)) {
      this.jsf.schema = _.cloneDeep(this.form.schema);
    } else if (isObject(this.JSONSchema)) {
      this.jsf.ReactJsonSchemaFormCompatibility = true;
      this.jsf.schema = _.cloneDeep(this.JSONSchema);
    } else if (hasOwn(this.form, 'JSONSchema') && isObject(this.form.JSONSchema)) {
      this.jsf.ReactJsonSchemaFormCompatibility = true;
      this.jsf.schema = _.cloneDeep(this.form.JSONSchema);
    } else if (hasOwn(this.form, 'properties') && isObject(this.form.properties)) {
      this.jsf.schema = _.cloneDeep(this.form);
    } else if (isObject(this.form)) {
      // TODO: Handle other types of form input
    }

    if (!isEmpty(this.jsf.schema)) {

      // Add type = 'object' if missing
      if (!hasOwn(this.jsf.schema, 'type') &&
        hasOwn(this.jsf.schema, 'properties') &&
        isObject(this.jsf.schema.properties)
      ) {
        this.jsf.schema.type = 'object';

      // Allow JSON schema shorthand (JSON Form style)
      } else if (!hasOwn(this.jsf.schema, 'type') ||
        this.jsf.schema.type !== 'object' ||
        !hasOwn(this.jsf.schema, 'properties')
      ) {
        this.jsf.JsonFormCompatibility = true;
        this.jsf.schema = { 'type': 'object', 'properties': this.jsf.schema };
      }

      // Update JSON Schema to version 6 format,
      // inluding v3 (JSON Form style) and v4 (Angular Schema Form style)
      this.jsf.schema = convertSchemaToDraft6(this.jsf.schema);

      // Initialize ajv and compile schema
      this.jsf.compileAjvSchema();

      // Create schemaRefLibrary, schemaRecursiveRefMap, & dataRecursiveRefMap
      this.jsf.schema = resolveSchemaReferences(
        this.jsf.schema, this.jsf.schemaRefLibrary,
        this.jsf.schemaRecursiveRefMap, this.jsf.dataRecursiveRefMap
      );

      // TODO: (?) Resolve external $ref links
      // // Create schemaRefLibrary & schemaRecursiveRefMap
      // this.parser.bundle(this.schema)
      //   .then(schema => this.schema = resolveSchemaReferences(
      //     schema, this.jsf.schemaRefLibrary,
      //     this.jsf.schemaRecursiveRefMap, this.jsf.dataRecursiveRefMap
      //   ));
    }
  }

  /**
   * 'initializeLayout' function
   *
   * Initialize 'layout'
   * Use first available array input:
   * 1. layout - recommended
   * 2. form - Angular Schema Form style
   * 3. form.form - JSON Form style
   * 4. form.layout - Single input style
   * 5. (none) no layout - set default layout instead
   *    (full layout will be built later from the schema)
   *
   * Also, if alternate layout formats are available,
   * import from 'UISchema' or 'customFormItems'
   * used for React JSON Schema Form and JSON Form API compatibility
   * Use first available input:
   * 1. UISchema - React JSON Schema Form style
   * 2. form.UISchema - For testing single input React JSON Schema Forms
   * 2. form.customFormItems - JSON Form style
   * 3. (none) no input - don't import
   */
  private initializeLayout() {

    // Rename JSON Form-style 'options' lists to
    // Angular Schema Form-style 'titleMap' lists.
    const fixJsonFormOptions = (layout: any): any => {
      if (isObject(layout) || isArray(layout)) {
        forEach(layout, (value, key) => {
          if (isObject(value) && hasOwn(value, 'options') && isObject(value.options)) {
            value.titleMap = value.options;
            delete value.options;
          }
        }, 'top-down');
      }
      return layout;
    }

    // Check for layout inputs and, if found, initialize form layout
    if (isArray(this.layout)) {
      this.jsf.layout = _.cloneDeep(this.layout);
    } else if (isArray(this.form)) {
      this.jsf.AngularSchemaFormCompatibility = true;
      this.jsf.layout = _.cloneDeep(this.form);
    } else if (this.form && isArray(this.form.form)) {
      this.jsf.JsonFormCompatibility = true;
      this.jsf.layout =
        fixJsonFormOptions(_.cloneDeep(this.form.form));
    } else if (this.form && isArray(this.form.layout)) {
      this.jsf.layout = _.cloneDeep(this.form.layout);
    } else {
      this.jsf.layout = this.jsf.globalOptions.addSubmit === false ?
        [ '*' ] :
        [ '*', { type: 'submit', title: 'Submit' } ];
    }

    // Check for alternate layout inputs
    let alternateLayout: any = null;
    if (isObject(this.UISchema)) {
      this.jsf.ReactJsonSchemaFormCompatibility = true;
      alternateLayout = _.cloneDeep(this.UISchema);
    } else if (hasOwn(this.form, 'UISchema')) {
      this.jsf.ReactJsonSchemaFormCompatibility = true;
      alternateLayout = _.cloneDeep(this.form.UISchema);
    } else if (hasOwn(this.form, 'uiSchema')) {
      this.jsf.ReactJsonSchemaFormCompatibility = true;
      alternateLayout = _.cloneDeep(this.form.uiSchema);
    } else if (hasOwn(this.form, 'customFormItems')) {
      this.jsf.JsonFormCompatibility = true;
      alternateLayout =
        fixJsonFormOptions(_.cloneDeep(this.form.customFormItems));
    }

    // if alternate layout found, copy alternate layout options into schema
    if (alternateLayout) {
      JsonPointer.forEachDeep(alternateLayout, (value, pointer) => {
        const schemaPointer = JsonPointer.toSchemaPointer(pointer, this.jsf.schema);
        // const schemaPointer = pointer
        //   .replace(/\//g, '/properties/')
        //   .replace(/\/properties\/items\/properties\//g, '/items/properties/')
        //   .replace(/\/properties\/titleMap\/properties\//g, '/titleMap/properties/');
        if (hasValue(value) && hasValue(pointer)) {
          const groupPointer = JsonPointer.parse(schemaPointer).slice(0, -2);
          let key = JsonPointer.toKey(schemaPointer);
          let itemPointer: string | string[];

          // If 'ui:order' object found, copy into object schema root
          if (key.toLowerCase() === 'ui:order') {
            itemPointer = [...groupPointer, 'ui:order'];

          // Copy other alternate layout options to schema 'x-schema-form',
          // (like Angular Schema Form options) and remove any 'ui:' prefixes
          } else {
            if (key.slice(0, 3).toLowerCase() === 'ui:') { key = key.slice(3); }
            itemPointer = [...groupPointer, 'x-schema-form', key];
          }
          if (JsonPointer.has(this.jsf.schema, groupPointer) &&
            !JsonPointer.has(this.jsf.schema, itemPointer)
          ) {
            JsonPointer.set(this.jsf.schema, itemPointer, value);
          }
        }
      });
    }
  }

  /**
   * 'initializeData' function
   *
   * Initialize 'initialValues'
   * defulat or previously submitted values used to populate form
   * Use first available input:
   * 1. data - recommended
   * 2. model - Angular Schema Form style
   * 3. form.value - JSON Form style
   * 4. form.data - Single input style
   * 5. formData - React JSON Schema Form style
   * 6. form.formData - For easier testing of React JSON Schema Forms
   * 7. (none) no data - initialize data from schema and layout defaults only
   */
  private initializeData() {
    if (isObject(this.data)) {
      this.jsf.initialValues = _.cloneDeep(this.data);
    } else if (isObject(this.model)) {
      this.jsf.AngularSchemaFormCompatibility = true;
      this.jsf.initialValues = _.cloneDeep(this.model);
    } else if (isObject(this.form) && isObject(this.form.value)) {
      this.jsf.JsonFormCompatibility = true;
      this.jsf.initialValues = _.cloneDeep(this.form.value);
    } else if (isObject(this.form) && isObject(this.form.data)) {
      this.jsf.initialValues = _.cloneDeep(this.form.data);
    } else if (isObject(this.formData)) {
      this.jsf.ReactJsonSchemaFormCompatibility = true;
      this.jsf.initialValues = _.cloneDeep(this.formData);
    } else if (hasOwn(this.form, 'formData') && isObject(this.form.formData)) {
      this.jsf.ReactJsonSchemaFormCompatibility = true;
      this.jsf.initialValues = _.cloneDeep(this.form.formData);
    }
  }

  /**
   * 'activateForm' function
   *
   * ...continued from 'initializeSchema' function, above
   * If 'schema' has not been initialized (i.e. no schema input found)
   * 6. If layout input - build schema from layout input
   * 7. If data input - build schema from data input
   *
   * Create final layout,
   * build the FormGroup template and the Angular FormGroup,
   * subscribe to changes,
   * and activate the form.
   */
  private activateForm() {

    // If 'schema' not initialized
    if (isEmpty(this.jsf.schema)) {

      // TODO: If full layout input (with no '*'), build schema from layout
      // if (this.jsf.layout.indexOf('*') === -1) {
      //   this.jsf.buildSchemaFromLayout();
      // } else

      // If data input, build schema from data
      if (!isEmpty(this.jsf.initialValues)) {
        this.jsf.buildSchemaFromData();
      }
    }

    if (!isEmpty(this.jsf.schema)) {

      // If not already initialized, initialize ajv and compile schema
      this.jsf.compileAjvSchema();

      // Build the Angular FormGroup template from the schema
      this.jsf.buildFormGroupTemplate();

      // Update all layout elements, add values, widgets, and validators,
      // replace any '*' with a layout built from all schema elements,
      // and update the FormGroup template with any new validators
      this.jsf.buildLayout(this.widgetLibrary);

      // Build the real Angular FormGroup from the FormGroup template
      this.jsf.buildFormGroup();
    }

    if (this.jsf.formGroup) {

      // TODO: Figure out how to display calculated values without changing object data
      // See http://ulion.github.io/jsonform/playground/?example=templating-values
      // Calculate references to other fields
      // if (!isEmpty(this.jsf.formGroup.value)) {
      //   forEach(this.jsf.formGroup.value, (value, key, object, rootObject) => {
      //     if (typeof value === 'string') {
      //       object[key] = this.jsf.parseText(value, value, rootObject, key);
      //     }
      //   }, 'top-down');
      // }

      // TODO: (?) (re-)render the form

      // Subscribe to form changes to output live data, validation, and errors
      this.jsf.dataChanges.subscribe(data => this.onChanges.emit(data));
      this.jsf.isValidChanges.subscribe(isValid => this.isValid.emit(isValid));
      this.jsf.validationErrorChanges.subscribe(errors => this.validationErrors.emit(errors));

      // Output final schema, final layout, and initial data
      this.formSchema.emit(this.jsf.schema);
      this.formLayout.emit(this.jsf.layout);
      this.onChanges.emit(this.jsf.data);

      // If 'validateOnRender' = true, output initial validation and any errors
      if (JsonPointer.get(this.jsf, '/globalOptions/validateOnRender')) {
        this.isValid.emit(this.jsf.isValid);
        this.validationErrors.emit(this.jsf.validationErrors);
      }
    }
  }
}
