# Angular JSON Schema Form

[![npm version](https://img.shields.io/npm/v/angular2-json-schema-form.svg?style=plastic)](https://www.npmjs.com/package/angular2-json-schema-form) [![npm downloads](https://img.shields.io/npm/dm/angular2-json-schema-form.svg?style=plastic)](https://www.npmjs.com/package/angular2-json-schema-form) [![GitHub MIT License](https://img.shields.io/github/license/dschnelldavis/angular2-json-schema-form.svg?style=social)](https://github.com/dschnelldavis/angular2-json-schema-form)
[![Dependencies](https://david-dm.org/dschnelldavis/angular2-json-schema-form.svg)](https://david-dm.org/dschnelldavis/angular2-json-schema-form) [![devDependencies](https://david-dm.org/dschnelldavis/angular2-json-schema-form/dev-status.svg)](https://david-dm.org/dschnelldavis/angular2-json-schema-form?type=dev)

A [JSON Schema](http://json-schema.org) Form builder for Angular 4 and 5, similar to, and mostly API compatible with,

  * [JSON Schema Form](https://github.com/json-schema-form)'s [Angular Schema Form](http://schemaform.io) for [AngularJS](https://angularjs.org) ([examples](http://schemaform.io/examples/bootstrap-example.html))
  * [Mozilla](https://blog.mozilla.org/services/)'s [React JSON Schema Form](https://github.com/mozilla-services/react-jsonschema-form) for [React](https://facebook.github.io/react/) ([examples](https://mozilla-services.github.io/react-jsonschema-form/)), and
  * [Joshfire](http://www.joshfire.com)'s [JSON Form](http://github.com/joshfire/jsonform/wiki) for [jQuery](https://jquery.com) ([examples](http://ulion.github.io/jsonform/playground/))

Note: This is currently a personal proof-of-concept project, and is not affiliated with any of the organizations listed above. (Though they are all awesome, and totally worth checking out.)

## Breaking change in version 0.7.0-alpha.1 and above

You must now import both JsonSchemaFormModule and a framework module. (Don't worry, it's easy.)
For full details, see 'To install from NPM and use in your own project', below.

## Check out the live demo and play with the examples

[Check out some examples here.](https://angular2-json-schema-form.firebaseapp.com/)

This example playground features over 70 different JSON Schemas for you to try (including all examples used by each of the three libraries listed above), and the ability to quickly view any example formatted with Material Design, Bootstrap 3, Bootstrap 4, or without any formatting.

## Installation

### To install from GitHub

To install [the library and the example playground from GitHub](https://github.com/dschnelldavis/angular2-json-schema-form), clone `https://github.com/dschnelldavis/angular2-json-schema-form.git` with your favorite git program. Or, assuming you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Node/NPM](https://nodejs.org/en/download/) installed, enter the following in your terminal:

```shell
git clone https://github.com/dschnelldavis/angular2-json-schema-form.git angular2-json-schema-form
cd angular2-json-schema-form
npm install
npm start
```

This should start a server with the example playground, which you can view in your browser at `http://localhost:4200`

All the source code is in the `/src` folder. Inside that folder, you will find the following sub-folders:

* `lib/src` - Angular JSON Schema Form main library
* `lib/src/framework-library` - framework library
* `lib/src/widget-library` - widget library
* `lib/src/shared` - various utilities and helper functions
* `demo` - the demonstration playground example application
* `demo/assets/example-schemas` - JSON Schema examples used in the playground

If you want detailed documentation describing the individual functions used in this library, run `npm run docs` to generate TypeDoc documentation, and then look in the generated `/docs/api` folder. (Angular JSON Schema Form is still a work in progress, so right now this documentation varies from highly detailed to completely missing.)

### To install from NPM and use in your own project

If, after playing with the examples, you decide this library is functional enough to use in your own project, you can [install it from NPM](https://www.npmjs.com/package/angular2-json-schema-form) using either [NPM](https://www.npmjs.com) or [Yarn](https://yarnpkg.com). To install with NPM, run the following from your terminal:

```shell
npm install angular2-json-schema-form
```

Then import JsonSchemaFormModule in your main application module, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {
  JsonSchemaFormModule, MaterialDesignFrameworkModule
} from 'angular2-json-schema-form';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    BrowserModule, MaterialDesignFrameworkModule,
    JsonSchemaFormModule.forRoot(MaterialDesignFrameworkModule)
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
```

Note that you have to import both the main JsonSchemaFormModule and a separate framework module (in this example, MaterialDesignFrameworkModule).

The framework module is listed in your imports section twice, once by itself (to load the framework's components) and again in the JsonSchemaFormModule.forRoot() function (to load the framework's service and tell Angular JSON Schema Form to use it).

Four framework modules are currently included:

* MaterialDesignFrameworkModule — Material Design
* Bootstrap3FrameworkModule — Bootstrap 3
* Bootstrap4FrameworkModule — Bootstrap 4
* NoFrameworkModule — plain HTML (for testing)

It is also possible to load multiple frameworks and switch between them at runtime, like the example playground on GitHub. But most typical sites will just load one framework.

#### Seed Application Examples

For complete examples of how to install and configure Angular JSON Schema Form to work with each included display framework, check out the following seed applications:

* [Angular JSON Schema Form Material Design Seed App](https://github.com/dschnelldavis/ng-jsf-material-design-seed)
* [Angular JSON Schema Form Bootstrap 3 Seed App](https://github.com/dschnelldavis/ng-jsf-bootstrap3-seed)
* [Angular JSON Schema Form Bootstrap 4 Seed App](https://github.com/dschnelldavis/ng-jsf-bootstrap4-seed)

#### Additional notes for Angular CLI

Make sure you are running a recent version of Angular CLI.

Very old versions of Angular CLI (e.g. 1.0.1) may fail with the error `Critical dependency: the request of a dependency is an expression` while trying to compile ajv (Another JSON Schema Validator). But this error has been fixed in newer versions. So if you receive that error, upgrade your Angular CLI.

#### Additional notes for SystemJS

If you use SystemJS, you will also need to make the following changes to your systemjs.config.js file. (If you're using a recent version of Angular CLI, or you don't have a systemjs.config.js file in your project, that means you're not using SystemJS, and you can safely ignore this section.)

Add these lines to the 'map' section of systemjs.config.js:
```javascript
'angular2-json-schema-form': 'npm:angular2-json-schema-form/bundles/angular2-json-schema-form.umd.js',
'ajv':                       'npm:ajv/dist/ajv.min.js',
'lodash':                    'npm:lodash/lodash.min.js'
```

(Note: These instructions have not been tested recently. If you use SystemJS and have problems, please post a bug report on GitHub.)

## Using Angular JSON Schema Form

### Basic use

For basic use, after loading JsonSchemaFormModule as described above, to display a form in your Angular component, simply add the following to your component's template:

```html
<json-schema-form
  loadExternalAssets="true"
  [schema]="yourJsonSchema"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where `schema` is a valid JSON schema object, and `onSubmit` calls a function to process the submitted JSON form data. If you don't already have your own schemas, you can find a bunch of samples to test with in the `src/demo/assets/example-schemas` folder, as described above.

Setting `loadExternalAssets="true"` will automatically load any additional assets needed by the display framework. It is useful when you are trying out this library, but production sites should instead load all required assets separately. For full details see 'Changing or adding frameworks', below.

### Data-only mode

Angular JSON Schema Form can also create a form entirely from a JSON object—with no schema—like so:

```html
<json-schema-form
  loadExternalAssets="true"
  [(ngModel)]="exampleJsonObject">
</json-schema-form>
```

```javascript
exampleJsonObject = {
  "first_name": "Jane", "last_name": "Doe", "age": 25, "is_company": false,
  "address": {
    "street_1": "123 Main St.", "street_2": null,
    "city": "Las Vegas", "state": "NV", "zip_code": "89123"
  },
  "phone_numbers": [
    { "number": "702-123-4567", "type": "cell" },
    { "number": "702-987-6543", "type": "work" }
  ], "notes": ""
};
```

In this mode, Angular JSON Schema Form automatically generates a schema from your data. The generated schema is relatively simple, compared to what you could create on your own. However, as the above example shows, it does detect and enforce string, number, and boolean values (nulls are also assumed to be strings), and automatically allows array elements to be added, removed, and reordered.

After displaying a form in this mode, you can also use the `formSchema` and `formLayout` outputs (described in 'Debugging inputs and outputs', below), to return the generated schema and layout, which will give you a head start on writing your own schemas and layouts by showing you examples created from your own data.

Also, notice that the 'ngModel' input supports Angular's 2-way data binding, just like other form controls, which is why it is not always necessary to use an onSubmit function.

### Advanced use

#### Additional inputs an outputs

For more control over your form, you may provide these additional inputs:

  * `layout` array with a custom form layout (see Angular Schema Form's [form definitions](https://github.com/json-schema-form/angular-schema-form/blob/master/docs/index.md#form-definitions) for information about how to construct a form layout)
  * `data` object to populate the form with default or previously submitted values
  * `options` object to set any global options for the form
  * `widgets` object to add custom widgets
  * `language` string to set the error message language (currently supports 'en' and 'fr')
  * `framework` string or object to set which framework to use

For `framework`, you can pass in your own custom framework object, or, if you've loaded multiple frameworks, you can specify the name of the framework you want to use. To switch between the included frameworks, use 'material-design', 'bootstrap-3', 'bootstrap-4', and 'no-framework'.

If you want more detailed output, you may provide additional functions for `onChanges` to read the values in real time as the form is being filled out, and you may implement your own custom validation indicators from the boolean `isValid` or the detailed `validationErrors` outputs.

Here is an example:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [layout]="yourJsonFormLayout"
  [(data)]="yourData"
  [options]="yourFormOptions"
  [widgets]="yourCustomWidgets"
  language="fr"
  framework="material-design"
  loadExternalAssets="true"
  (onChanges)="yourOnChangesFn($event)"
  (onSubmit)="yourOnSubmitFn($event)"
  (isValid)="yourIsValidFn($event)"
  (validationErrors)="yourValidationErrorsFn($event)">
</json-schema-form>
```

Note: If you prefer brackets around all your attributes, the following is functionally equivalent:

```html
<json-schema-form
[schema]="yourJsonSchema"
[layout]="yourJsonFormLayout"
[(data)]="yourData"
[options]="yourFormOptions"
[widgets]="yourCustomWidgets"
[language]="'fr'"
[framework]="'material-design'"
[loadExternalAssets]="true"
(onChanges)="yourOnChangesFn($event)"
(onSubmit)="yourOnSubmitFn($event)"
(isValid)="yourIsValidFn($event)"
(validationErrors)="yourValidationErrorsFn($event)">
</json-schema-form>
```

If you use this syntax, make sure to include the nested quotes (`"'` and `'"`) around the language and framework names. (If you leave out the inner quotes, Angular will read them as a variable names, rather than strings, which will cause errors. All un-bracketed attributes, however, are automatically read as strings, so they don't need inner quotes.)

#### Single-input mode

You may also combine all your inputs into one compound object and include it as a `form` input, like so:

```javascript
let yourCompoundInputObject = {
  schema:    { ... },  // REQUIRED
  layout:    [ ... ],  // optional
  data:      { ... },  // optional
  options:   { ... },  // optional
  widgets:   { ... },  // optional
  language:   '...' ,  // optional
  framework:  '...'    // (or { ... }) optional
}
```

```html
<json-schema-form
  [form]="yourCompoundInputObject"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

You can also mix these two styles depending on your needs. In the example playground, all examples use the combined `form` input for `schema`, `layout`, and `data`, which enables each example to control those three inputs, but the playground uses separate inputs for `language` and `framework`, enabling it to change those settings independent of the example.

Combining inputs is useful if you have many unique forms and store each form's data and schema together. If you have one form (or many identical forms), it will likely be more useful to use separate inputs for your data and schema. Though even in that case, if you use a custom layout, you could store your schema and layout together and use one input for both.

#### Compatibility modes

If you have previously used another JSON form creation library—Angular Schema Form (for AngularJS), React JSON Schema Form, or JSON Form (for jQuery)—in order to make the transition easier, Angular JSON Schema Form will recognize the input names and custom input objects used by those libraries. It should automatically work with JSON Schemas in [version 7](http://json-schema.org/draft-07/schema), [version 6](http://json-schema.org/draft-06/schema), [version 4](http://json-schema.org/draft-04/schema), [version 3](http://json-schema.org/draft-03/schema), or the [truncated version 3 format supported by JSON Form](https://github.com/joshfire/jsonform/wiki#schema-shortcut). So the following will all work:

Angular Schema Form (AngularJS) compatibility:
```html
<json-schema-form
  [schema]="yourJsonSchema"
  [form]="yourAngularSchemaFormLayout"
  [(model)]="yourData">
</json-schema-form>
```

React JSON Schema Form compatibility:
```html
<json-schema-form
  [schema]="yourJsonSchema"
  [UISchema]="yourReactJsonSchemaFormUISchema"
  [(formData)]="yourData">
</json-schema-form>
```

JSON Form (jQuery) compatibility:
```html
<json-schema-form
  [form]="{
    schema: yourJsonSchema,
    form: yourJsonFormLayout,
    customFormItems: yourJsonFormCustomFormItems,
    value: yourData
  }">
</json-schema-form>
```

Note: 2-way data binding will work with any dedicated data input, including 'data', 'model', 'ngModel', or 'formData'. However, 2-way binding will _not_ work with the combined 'form' input.

#### Debugging inputs and outputs

Finally, Angular JSON Schema Form includes some additional inputs and outputs for debugging:

* `debug` input — Activates debugging mode.
* `loadExternalAssets` input — Causes external JavaScript and CSS needed by the selected framework to be automatically loaded from a CDN (this is not 100% reliable, so while this can be helpful during development and testing, it is not recommended for production)—Note: If you are using this mode and get a console error saying an external asset has not loaded (such as jQuery, required for Bootstrap 3) simply reloading your web browser will usually fix it.
* `formSchema` and `formLayout` outputs — Returns the final schema and layout used to create the form (which will either show how your original input schema and layout were modified, if you provided inputs, or show you the automatically generated ones, if you didn't).

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [debug]="true"
  loadExternalAssets="true"
  (formSchema)="showFormSchemaFn($event)"
  (formLayout)="showFormLayoutFn($event)">
</json-schema-form>
```

## Customizing

In addition to a large number of user-settable options, Angular JSON Schema Form also has the ability to load custom form control widgets and layout frameworks. All forms are constructed from these basic components. The default widget library includes all standard HTML 5 form controls, as well as several common layout patterns, such as multiple checkboxes and tab sets. The default framework library includes templates to style forms using Material Design, Bootstrap 3, or Bootstrap 4 (or plain HTML with no formatting, which is not useful in production, but can be helpful for development and debugging).

### User settings

(TODO: List all available user settings, and configuration options for each.)

### Creating custom input validation error messages

You can easily add your own custom input validation error messages, either for individual control widgets, or for your entire form.

#### Setting error messages for individual controls or the entire form

To set messages for individual form controls, add them to that control's node in the form layout, like this:

```javascript
let yourFormLayout = [
  { key: 'name',
    title: 'Enter your name',
    validationMessages: {
      // Put your error messages for the 'name' field here
    }
  },
  { type: 'submit', title: 'Submit' }
]
```

To set messages for the entire form, add them to the form options, inside the defautWidgetOptions validationMessages object, like this:

```javascript
let yourFormOptions = {
  defautWidgetOptions: {
    validationMessages: {
      // Put your error messages for the entire form here
    }
  }
}
```

#### How to format error messages

The validationMessages object—in either a layout node or the form options—contains the names of each error message you want to set as keys, and the corresponding messages as values. Messages may be in any of the following formats:

 * String: A plain text message, which is always the same.
 * String template: A text message that includes Angular template-style {{variables}}, which will be be replaced with values from the returned error object.
 * Function: A JavaScript function which accepts the error object as input, and returns a string error message.

Here are examples of all three error message types:
```javascript
validationMessages: {

  // String error message
  required: 'This field is required.',

  // String template error message
  // - minimumLength variable will be replaced
  minLength: 'Must be at least {{minimumLength}} characters long.',

  // Function error message
  // - example error object:   { multipleOfValue: 0.01, currentValue: 3.456 }
  // - resulting error message: 'Must have 2 or fewer decimal places.'
  multipleOf: function(error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `Must have ${decimals} or fewer decimal places.`;
    } else {
      return `Must be a multiple of ${error.multipleOfValue}.`;
    }
  }
}
```
(Note: These examples are from the default set of built-in error messages, which includes messages for all JSON Schema errors except type, const, enum, and dependencies.)

#### Available input validation errors and object values

Here is a list of all the built-in JSON Schema errors, which data type each error is available for, and the values in their returned error objects:

Error name       | Data type | Returned error object values
-----------------|-----------|-----------------------------------------
required         |  any      | (none)
type             |  any      | requiredType,          currentValue
const            |  any      | requiredValue,         currentValue
enum             |  any      | allowedValues,         currentValue
minLength        |  string   | minimumLength,         currentLength
maxLength        |  string   | maximumLength,         currentLength
pattern          |  string   | requiredPattern,       currentValue
format           |  string   | requiredFormat,        currentValue
minimum          |  number   | minimumValue,          currentValue
exclusiveMinimum |  number   | exclusiveMinimumValue, currentValue
maximum          |  number   | maximumValue,          currentValue
exclusiveMaximum |  number   | exclusiveMaximumValue, currentValue
multipleOf       |  number   | multipleOfValue,       currentValue
minProperties    |  object   | minimumProperties,     currentProperties
maxProperties    |  object   | maximumProperties,     currentProperties
 dependencies  * |  object   | (varies, based on dependencies schema)
minItems         |  array    | minimumItems,          currentItems
maxItems         |  array    | maximumItems,          currentItems
uniqueItems      |  array    | duplicateItems
 contains      * |  array    | requiredItem

* Note: The `contains` and `dependencies` validators are still in development, and do not yet work correctly.

### Changing or adding widgets

To add a new widget or override an existing widget, either add an object containing your new widgets to the `widgets` input of the `<json-schema-form>` tag, or load the `WidgetLibraryService` and call `registerWidget(widgetType, widgetComponent)`, with a string type name and an Angular component to be used whenever a form needs that widget type.

Example:

```javascript
import { YourInputWidgetComponent } from './your-input-widget.component';
import { YourCustomWidgetComponent } from './your-custom-widget.component';
...
let yourNewWidgets = {
  input: YourInputWidgetComponent,          // Replace existing 'input' widget
  custom-control: YourCustomWidgetComponent // Add new 'custom-control' widget
}
```
...and...
```html
<json-schema-form
  [schema]="yourJsonSchema"
  [widgets]="yourNewWidgets">
</json-schema-form>
```
...or...
```javascript
import { WidgetLibraryService } from 'angular2-json-schema-form';
...
constructor(private widgetLibrary: WidgetLibraryService) { }
...
// Replace existing 'input' widget:
widgetLibrary.registerWidget('input', YourInputWidgetComponent);
// Add new 'custom-control' widget:
widgetLibrary.registerWidget('custom-control', YourCustomWidgetComponent);
```

To see many examples of widgets, explore the source code, or call `getAllWidgets()` from the `WidgetLibraryService` to see all widgets currently available in the library. All default widget components are in the `/src/lib/src/widget-library` folder, and all custom Material Design widget components are in the `/src/lib/src/framework-library/material-design-framework` folder. (The Bootstrap 3 and Bootstrap 4 frameworks just reformat the default widgets, and so do not include any custom widgets of their own.)

### Changing or adding frameworks

To change the active framework, either use the `framework` input of the `<json-schema-form>` tag, or load the `FrameworkLibraryService` and call `setFramework(yourCustomFramework)`, with either the name of an available framework ('bootstrap-3', 'bootstrap-4', 'material-design', or 'no-framework'), or with your own custom framework object, like so:

```javascript
import { YourFrameworkComponent } from './your-framework.component';
import { YourWidgetComponent } from './your-widget.component';
...
let yourCustomFramework = {
  framework: YourFrameworkComponent,                                // required
  widgets:     { 'your-widget-name': YourWidgetComponent,   ... },  // optional
  stylesheets: [ '//url-to-framework-external-style-sheet', ... ],  // optional
  scripts:     [ '//url-to-framework-external-script',      ... ]   // optional
}
```
...and...
```html
<json-schema-form
  [schema]="yourJsonSchema"
  [framework]="yourCustomFramework">
</json-schema-form>
```
...or...
```javascript
import { FrameworkLibraryService } from 'angular2-json-schema-form';
...
constructor(private frameworkLibrary: FrameworkLibraryService) { }
...
frameworkLibrary.setFramework(yourCustomFramework);
```

The value of the required `framework` key is an Angular component which will be called to format each widget before it is displayed. The optional `widgets` object contains any custom widgets, which will override or supplement the built-in widgets. And the optional `stylesheets` and `scripts` arrays contain URLs to any additional external style sheets or JavaScript libraries required by the framework. These are the external stylesheets and scripts that will be loaded if the "loadExternalAssets" option is set to "true".

#### Loading external assets required by a framework

Most Web layout framework libraries (including both Bootstrap and Material Design) need additional external JavaScript and/or CSS assets loaded in order to work properly. The best practice is to load these assets separately in your site, before calling Angular JSON Schema Form. (For the included libraries, follow these links for more information about how to do this: [Bootstrap](http://getbootstrap.com/getting-started/) and [Material Design](https://github.com/angular/material2/blob/master/GETTING_STARTED.md).)

Alternately, during development, you may find it helpful to let Angular JSON Schema Form load these resources for you (as wed did in the 'Basic use' example, above), which you can do in several ways:

  * Call `setFramework` with a second parameter of `true` (e.g. `setFramework('material-design', true)`), or
  * Add `loadExternalAssets: true` to your `options` object, or
  * Add `loadExternalAssets="true"` to your `<json-schema-form>` tag, as shown above

Finally, if you want to see what scripts a particular framework will automatically load, after setting that framework you can call `getFrameworkStylesheets()` or `getFrameworkScritps()` from the `FrameworkLibraryService` to return the built-in arrays of URLs.

However, if you are creating a production site you should load these assets separately, and make sure to remove all references to `loadExternalAssets` to prevent the assets from being loaded twice.

#### Two approaches to writing your own frameworks

The two built-in frameworks (in the `/src/lib/src/framework-library` folder) demonstrate different strategies for how frameworks can style form elements. The Bootstrap 3 and Bootstrap 4 frameworks are very lightweight and include no additional widgets (though they do load some external stylesheets and scripts). They work entirely by adding styles to the default widgets. In contrast, the Material Design framework uses the [Material Design for Angular](https://material.angular.io) library to replace most of the default form control widgets with custom widgets from that library.

## Contributions and future development

If you find this library useful, I'd love to hear from you. If you have any trouble with it or would like to request a feature, please [post an issue on GitHub](https://github.com/dschnelldavis/angular2-json-schema-form/issues).

If you're a programmer and would like a fun intermediate-level Angular project to hack on, clone the library and take a look at the source code. I wrote this library both because I needed an Angular JSON Schema Form builder, and also as a way to sharpen my Angular skills. This project is just complex enough to be challenging and fun, but not so difficult as to be overwhelming. One thing I particularly like is that each example in the demo playground is like a little puzzle which provides immediate feedback—as soon as it works perfectly, you know you've solved it.

I've also tried to split things into small modules as much as possible, so even though some code is still a bit messy, most individual parts should be straightforward to work with. (A lot of the code is well commented, though some isn't—but I'm working to fix that. If you run into anything you don't understand, please ask.) If you make improvements, please [submit a pull request](https://github.com/dschnelldavis/angular2-json-schema-form/pulls) to share what you've done.

This library is mostly functional (I'm already using it in another large site, where it works well), but it still has many small bugs to fix and enhancements that could be made. Here's a random list of some stuff I know needs to be added or improved:

  * TDD tests—The single biggest flaw in this library is that each change or improvement has the potential to break something else (which has already happened several times). Integrating automated tests into the build process would fix that.

  * More frameworks—Not everyone uses Material Design, Bootstrap 3, or [Bootstrap 4](https://github.com/ng-bootstrap/ng-bootstrap), so it would be great to create framework plug-ins for [Foundation 6](https://github.com/zurb/foundation-sites), [Semantic UI](https://github.com/vladotesanovic/ngSemantic), or other web design frameworks.

  * More widgets—There are lots of great form controls available, such as the [Pikaday calendar](https://github.com/dbushell/Pikaday), [Spectrum color picker](http://bgrins.github.io/spectrum), and [ACE code editor](https://ace.c9.io), which just need small custom wrappers to convert them into Angular JSON Schema Form plug-ins. In addition, there are a few additional features of HTML, JSON Schema, and Material Design which could be fixed by adding new widgets:

    * [A file widget](https://github.com/dschnelldavis/angular2-json-schema-form/issues/38)—To support uploading files, this widget would display an HTML file input, and then include the uploaded file in the form's output data, as an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsArrayBuffer) or [DataURL](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL).

    * [A oneOf widget](https://github.com/dschnelldavis/angular2-json-schema-form/issues/112)—To support schemas using oneOf or anyOf, this widget would enable a user to choose an option from a select list, which would then replace another control on the form.

    * [An addAdditionalProperties widget](https://github.com/dschnelldavis/angular2-json-schema-form/issues/104)—To support schemas using additionalProperties or patternProperties, this widget would enable users to enter a name to add a new property to an object, and would then add a new control to the form for setting that property's value (similar to the existing [add-reference widget](https://github.com/dschnelldavis/angular2-json-schema-form/blob/master/src/lib/src/widget-library/add-reference.component.ts)).

    * [A matStepper widget](https://github.com/dschnelldavis/angular2-json-schema-form/issues/123)—To support the [Angular Material Stepper control](https://material.angular.io/components/stepper/overview) (similar to the existing [tabs](https://github.com/dschnelldavis/angular2-json-schema-form/blob/master/src/lib/src/widget-library/tabs.component.ts) widget).

If you like this library, need help, or want to contribute, let me know. I'm busy, so it sometimes takes me a long time to respond, but I will eventually get back to you. :-)

Thanks! I hope you enjoy using this library as much as I enjoyed writing it.

# License

[MIT](/LICENSE)
