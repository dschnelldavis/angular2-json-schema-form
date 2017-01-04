# Angular 2 JSON Schema Form

[![npm version](https://img.shields.io/npm/v/angular2-json-schema-form.svg?style=plastic)](https://www.npmjs.com/package/angular2-json-schema-form) [![npm downloads](https://img.shields.io/npm/dm/angular2-json-schema-form.svg?style=plastic)](https://www.npmjs.com/package/angular2-json-schema-form) [![GitHub MIT License](https://img.shields.io/github/license/dschnelldavis/angular2-json-schema-form.svg?style=social)](https://github.com/dschnelldavis/angular2-json-schema-form)

A [JSON Schema](http://json-schema.org) Form builder for Angular 2, similar to, and mostly API compatible with,

  * [JSON Schema Form](https://github.com/json-schema-form)'s [Angular Schema Form](http://schemaform.io) for [Angular 1](https://angularjs.org) ([examples](http://schemaform.io/examples/bootstrap-example.html))
  * [Mozilla](https://blog.mozilla.org/services/)'s [React JSON Schema Form](https://github.com/mozilla-services/react-jsonschema-form) for [React](https://facebook.github.io/react/) ([examples](https://mozilla-services.github.io/react-jsonschema-form/)), and
  * [Joshfire](http://www.joshfire.com)'s [JSON Form](http://github.com/joshfire/jsonform/wiki) for [jQuery](https://jquery.com) ([examples](http://ulion.github.io/jsonform/playground/))

Note: This is a personal proof-of-concept project, and is NOT currently affiliated with any of the organizations listed above. (Though they are all awesome, and totally worth checking out.)

## Installation

### To install from GitHub and play with the examples

The [GitHub](https://github.com) version of Angular 2 JSON Schema Form includes an example playground with over 70 different JSON Schemas (including all examples used by each of the three libraries listed above), and the ability to quickly view any example formatted using Bootstrap 3 or Material Design (or with no formatting, which is functional, but usually pretty ugly).

To install both the library and the example playground, clone `https://github.com/dschnelldavis/angular2-json-schema-form.git` with your favorite git program, or, assuming you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Node/NPM](https://nodejs.org/en/download/) installed, enter the following in your terminal:

```
git clone https://github.com/dschnelldavis/angular2-json-schema-form.git angular2-json-schema-form
cd angular2-json-schema-form
npm install
npm start
```

This should start the example playground locally and display it at `http://localhost:3000`

All the source code is in the `/src` folder. Inside that folder, you will find the following sub-folders:

* `library` contains the Angular 2 JSON Schema Form library
* `playground` contains the example playground
* `playground/examples` contains the JSON Schema examples
* `frameworks` contains the framework library (described below)
* `widgets` contains the widget library

If you want additional documentation describing the individual functions used in this library, run `npm run docs` to generate TypeDoc documentation, and then look in the newly generated `/docs` folder. (Angular 2 JSON Schema Form is still a work in progress, so right now this documentation varies from highly detailed to completely missing.)

### To install from NPM and use in your own project

If, after playing with the examples, you decide this library is functional enough to use in your own project, you can install it from [NPM](https://www.npmjs.com) by running the following from your terminal:

```
npm install angular2-json-schema-form --save
```

Then add this line to your main application module:
```javascript
import { JsonSchemaFormModule } from 'angular2-json-schema-form';
```

And finally, add `JsonSchemaFormModule.forRoot()` to the `imports` array in your @NgModule declaration.

(If you plan to use the Material Design framework, you will also need to import the '@angular/material' module in the same way.)

Your final app.module.ts should look something like this:

```javascript
import { NgModule }             from '@angular/core';
import { BrowserModule }        from '@angular/platform-browser';
import { MaterialModule }       from '@angular/material';

import { JsonSchemaFormModule } from 'angular2-json-schema-form';

import { AppComponent }         from './app.component';

@NgModule({
  imports:      [
    BrowserModule, MaterialModule.forRoot(), JsonSchemaFormModule.forRoot()
  ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
```

Also, if you use SystemJS, you will also need to make the following changes to your systemjs.config.js file.

Add these three lines to the 'map' section:
```javascript
'angular2-json-schema-form': 'npm:angular2-json-schema-form',
'ajv':                       'npm:ajv/dist/ajv.min.js',
'lodash':                    'npm:lodash/lodash.min.js',
```

And add this line to the 'packages' section:
```javascript
'angular2-json-schema-form': { main: './dist/index.js', defaultExtension: 'js' },
```

(For a complete example of how to install and use the library, clone the GitHub repository and look at how the library is imported into the example playground.)

## Using Angular 2 JSON Schema Form

### Basic use

For basic use, after loading the JsonSchemaFormModule as described above, to add a form to your Angular 2 component, simply add the following to your component's template:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  loadExternalAssets="true"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where the `schema` input is a valid JSON schema object (either v3 or v4), and the `onSubmit` output is a function that will be called when the form is submitted, with the results of the form as a JSON object. If you don't already have your own schemas, you can find a whole bunch of samples to test with in the `src/playground/examples` folder, as described above.

(Note: The `loadExternalAssets` attribute is useful when you are first trying out this library, but you will usually want to remove it in your production sites. For a full explanation, see 'Changing or adding frameworks', below.)

### Advanced use

#### Additional inputs an outputs

For more advanced cases, you may also provide three additional inputs:

* `layout` with a custom form layout (see Angular Schema Form's [form definitions](https://github.com/json-schema-form/angular-schema-form/blob/master/docs/index.md#form-definitions) for information about how to construct a form layout)
* `data` to populate the form with defaults or previously submitted values
* `options` to set any global options for the form
* `widgets` to set any custom widgets
* `framework` to set which framework to use

If you want more detailed output, you may provide additional functions for `onChanges` to read the values in real time as the form is being filled out, and you may implement your own custom validation indicators from the boolean `isValid` or the detailed `validationErrors` outputs.

Here is an example:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [layout]="yourJsonFormLayout"
  [data]="yourData"
  [options]="yourGlobalOptionSettings"
  [widgets]="yourCustomWidgets"
  [framework]="nameOfFrameworkToUse-or-yourCustomFramework"
  (onChanges)="yourOnChangesFn($event)"
  (onSubmit)="yourOnSubmitFn($event)"
  (isValid)="yourIsValidFn($event)"
  (validationErrors)="yourValidationErrorsFn($event)">
</json-schema-form>
```

#### Single-input mode

You may also combine all your inputs into one compound object and include it as a `form` input, like so:

```javascript
let yourCompoundInputObject = {
  schema:  {...}, // required
  layout:  [...], // optional
  data:    {...}, // optional
  options: {...}  // optional
}
```

```html
<json-schema-form
  [form]="yourCompoundInputObject"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

All samples in example playground use the combined `form` input, which is why they do not require separate `schema`, `layout`, and `data` inputs.

This mode is also useful in cases where you want to store the data and the schema together in the same datastore.

#### Data-only mode

A new experimental feature will also create a form entirely from a JSON object—with no schema—like so:

```javascript
let exampleJsonObject = {
  "first_name": "Jane", "last_name": "Doe", "age": 25, "is_company": false,
  "address": {
    "street_1": "123 Main St.", "street_2": null,
    "city": "Las Vegas", "state": "NV", "zip_code": "89123"
  },
  "phone_numbers": [
    { "number": "702-123-4567", "type": "cell" },
    { "number": "702-987-6543", "type": "work" }
  ], "notes": ""
}
```

```html
<json-schema-form
  [data]="exampleJsonObject"
  loadExternalAssets="true"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

In this mode, Angular 2 JSON Schema Form generates a schema from your data on the fly. The generated schema is obviously very simple compared to what you could create on your own. However, as the above example shows, it correctly detects and requires strings, numbers, and boolean values (null inputs are assumed to be strings), and automatically allows elements to be added and removed from arrays.

After displaying a form in this mode, you can also use the `formSchema` and `formLayout` outputs (described  in 'Debugging inputs and outputs', below), to return the generated schema and layout, which will give you a head start on writing your own schemas and layouts by showing you examples created from your own data.

#### Compatibility modes

If you have previously used Angular Schema Form, JSON Form, or React JSON Schema Form, in order to make the transition easier, Angular2 JSON Schema Form will recognize the input names and custom input objects used by those libraries, and will automatically work with JSON Schemas in [version 4](http://json-schema.org/draft-03/schema), [version 3](http://json-schema.org/draft-03/schema), or the [truncated version 3 format supported by JSON Form](https://github.com/joshfire/jsonform/wiki#schema-shortcut). So the following will all work:

Angular Schema Form compatibility:
```html
<json-schema-form
  [schema]="yourJsonSchema"
  [form]="yourAngularSchemaFormLayout"
  [model]="yourData">
</json-schema-form>
```

JSON Form compatibility:
```html
<json-schema-form
  [form]="{
    schema: 'yourJsonSchema',
    form: 'yourJsonFormLayout',
    customFormItems: 'yourJsonFormCustomFormItems',
    value: 'yourData'
  }">
</json-schema-form>
```

React JSON Schema Form compatibility:
```html
<json-schema-form
  [JSONSchema]="yourJsonSchema"
  [UISchema]="yourReactJsonSchemaFormUISchema"
  [formData]="yourData">
</json-schema-form>
```

#### Debugging inputs and outputs

Finally, Angular2 JSON Schema Form includes some additional inputs and outputs for debugging:

* `debug` input—activates debugging mode
* `loadExternalAssets` input—automatically loads external JavaScript and CSS needed by the selected framework (this is not 100% reliable, so while this may be helpful during development and testing, it is not recommended in production)
* `formSchema` and `formLayout` outputs—returns the final schema and layout used to create the form  (which will either show how your original input schema and layout were modified, if you provided inputs, or show you the automatically generated ones, if you didn't)

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [debug]="true"
  [loadExternalAssets]="true"
  (formSchema)="showFormSchemaFn($event)"
  (formLayout)="showFormLayoutFn($event)">
</json-schema-form>
```

## Customizing

Angular 2 JSON Schema Form has two built-in features designed to make it easy to customize at run-time: a widget library and a framework library. All forms are constructed from these basic components. The default widget library includes all standard HTML 5 form controls, as well as several common layout patterns, such as multiple checkboxes and tab sets. And the default framework library includes templates to style forms using either Bootstrap 3 or Material Design (or with no formatting, which is not useful in production, but can be helpful for debugging).

### Changing or adding widgets

To add a new widget or override an existing widget, either add an object containing your new widgets to the `widgets` input of the `<json-schema-form>` tag, or load the `WidgetLibraryService` and call `registerWidget(widgetType, widgetComponent)`, with a string type name and an Angular 2 component to be used whenever a form needs that widget type.

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

To see many examples of widgets, explore the source code, or call `getAllWidgets()` from the `WidgetLibraryService` to see all widgets currently available in the library. All default widget components are in the `/src/widgets` folder, and all custom Material Design widget components are in the `/src/frameworks/material-design` folder. (The Bootstrap framework just reformats the default widgets, and so does not include any custom widgets if its own.)

### Changing or adding frameworks

To change the active framework, either use the `framework` input of the `<json-schema-form>` tag, or load the `FrameworkLibraryService` and call `setFramework(yourCustomFramework)`, with either the name of an available framework (by default 'no-framework', 'bootstrap-3' or 'material-design'), or with your own custom framework object in the following format:

```javascript
import { YourFrameworkComponent } from './your-framework.component';
import { YourWidgetComponent } from './your-widget.component';
...
let yourCustomFramework = {
  framework: YourFrameworkComponent,                               // required
  widgets:     { 'your-widget-name': YourWidgetComponent, ... },   // optional
  stylesheets: [ '//url-to-framework-external-style-sheet', ... ], // optional
  scripts:     [ '//url-to-framework-external-script', ... ]       // optional
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

The value of the required `framework` key is an Angular 2 component which will be called to format each widget before it is displayed. The optional `widgets` object contains any custom widgets which will override or supplement the built-in widgets. And the optional `stylesheets` and `scripts` arrays contain URLs to any additional external style sheets or JavaScript libraries required by the framework.

#### Loading external assets required by a framework

Most Web layout framework libraries (including both Bootstrap and Material Design) need additional external JavaScript and/or CSS assets loaded in order to work properly. The best practice is to load these assets separately in your site, before calling Angular 2 JSON Schema Form. (For the included libraries, follow these links for more information about how to do this: [Bootstrap](http://getbootstrap.com/getting-started/) and [Material Design](https://github.com/angular/material2/blob/master/GETTING_STARTED.md).)

Alternately, during development, you may find it helpful to let Angular 2 JSON Schema Form load these resources for you (as wed did in the 'Basic use' example, above), which you can do in several ways:

* Call `setFramework` with a second parameter of `true` (e.g. `setFramework('material-design', true)`), or
* Add `loadExternalAssets: true` to your `options` object, or
* Add `loadExternalAssets="true"` to your `<json-schema-form>` tag, as shown above

Finally, if you want to find what scripts a particular framework will automatically load, after setting that framework you can call `getFrameworkStylesheets()` or `getFrameworkScritps()` from the `FrameworkLibraryService` to return the built-in arrays of URLs.

However, if you are creating a production site you should load these assets separately, and remove all references to `loadExternalAssets` to prevent the assets from being loaded twice.

#### Two strategies for writing your own frameworks

The two built-in frameworks (both in the `/src/frameworks` folder) demonstrate different strategies for how frameworks can style form elements. The Bootstrap 3 framework is very lightweight and includes no additional widgets (though it does load some external stylesheets and scripts) and works entirely by adding styles to the default widgets. In contrast, the Material Design framework uses the [Material Design for Angular 2](https://github.com/angular/material2) library (which must also be loaded into the application separately, as described above) to replace most of the default form control widgets with custom widgets from that library.

## Contributions and future development

If you find this library useful, I'd love to hear from you. If you have any trouble with it or would like to request a feature, please [post an issue on GitHub](https://github.com/dschnelldavis/angular2-json-schema-form/issues). If you've made any improvements, please [make a pull request](https://github.com/dschnelldavis/angular2-json-schema-form/pulls), so I can share your improvements with everyone else who uses this library.

I wrote this library because I needed a JSON Schema Form builder to use in a large Angular 2 project I am currently working on. Though I found excellent libraries for Angular 1, React, and jQuery (all linked above), I could not find anything similar for Angular 2—so I wrote this library to fill that gap. The current version is mostly functional, and even includes a few enhancements not available in some other libraries, such as supporting less common JSON Schema features like `oneOf`, `allOf`, and `$ref` links (including recursive links). However, it still has many small bugs, such as not dynamically enabling and disabling conditionally required fields inside objects, and is fragile because it does not yet include any testing framework. Hopefully all these issues will get fixed eventually, but as I'm just a single busy programmer, I can't guarantee how long it will take. In the meantime, I hope you find it useful, and if you do, please send me your feedback.

Thanks! I hope you enjoy using this library as much as I enjoyed writing it. :-)

# License

[MIT](/LICENSE)
