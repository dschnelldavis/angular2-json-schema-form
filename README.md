# Angular 2 JSON Schema Form

[![npm version](https://img.shields.io/npm/v/angular2-json-schema-form.svg?style=plastic)](https://www.npmjs.com/package/angular2-json-schema-form) [![npm downloads](https://img.shields.io/npm/dm/angular2-json-schema-form.svg?style=plastic)](https://www.npmjs.com/package/angular2-json-schema-form) [![GitHub MIT License](https://img.shields.io/github/license/dschnelldavis/angular2-json-schema-form.svg?style=social)](https://github.com/dschnelldavis/angular2-json-schema-form)

A [JSON Schema](http://json-schema.org) Form builder for Angular 2, similar to, and mostly API compatible with,

  * [JSON Schema Form](https://github.com/json-schema-form)'s [Angular Schema Form](http://schemaform.io) for [Angular 1](https://angularjs.org) ([examples](http://schemaform.io/examples/bootstrap-example.html))
  * [Mozilla](https://blog.mozilla.org/services/)'s [React JSON Schema Form](https://github.com/mozilla-services/react-jsonschema-form) for [React](https://facebook.github.io/react/) ([examples](https://mozilla-services.github.io/react-jsonschema-form/)), and
  * [Joshfire](http://www.joshfire.com)'s [JSON Form](http://github.com/joshfire/jsonform/wiki) for [jQuery](https://jquery.com) ([examples](http://ulion.github.io/jsonform/playground/))

Note: This is a personal proof-of-concept project, and is NOT currently affiliated with any of the organizations listed above. (Though they are all awesome, and totally worth checking out.)

## Installation

### To install from GitHub and play with the examples

The [GitHub](https://github.com) version of Angular 2 JSON Schema Form includes an example playground with over 70 different JSON Schemas (including all examples used by each of the three libraries listed above), and the ability to quickly view any example formatted using Bootstrap 3 or Material Design (or without formatting, which is functional, but usually pretty ugly).

To install both the library and the example playground, clone `https://github.com/dschnelldavis/angular2-json-schema-form.git` with your favorite git program, or, assuming you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Node/NPM](https://nodejs.org/en/download/) installed, enter the following in your terminal:

```
git clone https://github.com/dschnelldavis/angular2-json-schema-form.git angular2-json-schema-form
cd angular2-json-schema-form
npm install
npm start
```

(Note for Windows users: To run `npm start`, you will also need an rsync program, such as [cwRsync](https://www.itefix.net/content/cwrsync-free-edition).)

This should start the example playground locally and display it at `http://localhost:3000`

All the source code is in the `/src` folder. Inside that folder, you will find the following sub-folders:

* `library` contains the Angular 2 JSON Schema Form library.
* `playground` contains the example playground.
* `playground/examples` contains the JSON Schema examples.
* `frameworks` contains the framework library (described below).
* `widgets` contains the widget library.

If you want additional documentation describing the individual functions used in this library, run `npm run docs` to generate TypeDoc documentation, and then look in the newly generated `/docs` folder. (Angular 2 JSON Schema Form is still a work in progress, so this documentation will vary from highly informative to completely missing.)

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

(Note: The `loadExternalAssets` attribute is useful when you are first trying out this library, but you will usually want to remove it in your production sites. You can find more details about this in 'Changing or adding frameworks', below.)

### Advanced use

#### Additional inputs an outputs

For more advanced cases, you may also provide three additional inputs:

* `layout` with a custom form layout (see Angular Schema Form's [form definitions](https://github.com/json-schema-form/angular-schema-form/blob/master/docs/index.md#form-definitions) for information about how to construct a form layout)
* `data` to populate the form with defaults or previously submitted values, and
* `options` to set any global options for the form.

If you want more detailed output, you may provide additional functions for `onChanges` to read the form values in real time (including before the completed form has been submitted) and you may implement your own custom validation from the boolean `isValid` or the detailed `validationErrors` outputs.

Here is an example:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [layout]="yourJsonFormLayout"
  [data]="yourData"
  [options]="yourGlobalOptionSettings"
  (onChanges)="yourOnChangesFn($event)"
  (onSubmit)="yourOnSubmitFn($event)"
  (isValid)="yourIsValidFn($event)"
  (validationErrors)="yourValidationErrorsFn($event)">
</json-schema-form>
```

#### Single-input mode

Alternately, you may also combine all your inputs into one compound object and include it as a `form` input, like so:

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

Finally, Angular 2 JSON Schema Form also includes an experimental feature to create a form entirely from a JSON object—with no schema—like so:

```javascript
let exampleJsonObject = {
  "first_name": "Jane", "last_name": "Doe", "age": 25, "is_company": false,
  "address": { "street_1": "123 Main St.", "street_2": null,
    "city": "Las Vegas", "state": "NV", "zip_code": "89123" },
  "phone_numbers": [ { "number": "702-123-4567", "type": "cell" },
    { "number": "702-987-6543", "type": "work" } ], "notes": ""
}
```

```html
<json-schema-form
  [data]="exampleJsonObject"
  loadExternalAssets="true"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

In this mode, Angular 2 JSON Schema Form generates a schema from your data on the fly. The generated schema is obviously very simple, compared to what you could create on your own. However, the above example shows how it will correctly detect and require strings, numbers, and boolean values (null inputs are also assumed to be strings), and will also allow elements to be added and removed from arrays.

After displaying a form in this mode, you can also call `getSchema()` and `getLayout()` from the `JsonSchemaFormService` to return the automatically generated schema and form layout, which can give you an example created from your own data, and head start on writing your own schemas and layouts.

## Customizing

Angular 2 JSON Schema Form has two built-in features designed to make it easy to customize at run-time: a widget library and a framework library. All forms are constructed from these basic components. The default widget library includes all standard HTML 5 form controls, as well as several common layout patterns, such as multiple checkboxes and tab sets. And the default framework library includes templates to style forms using either Bootstrap 3 or Material Design.

### Changing or adding widgets

To add a new widget or override an existing widget, load the `WidgetLibraryService` and call `registerWidget(widgetType, widgetComponent)`, with a string type name and an Angular 2 component to be used whenever a form needs that widget type.

Example:

```javascript
import { WidgetLibraryService } from 'angular2-json-schema-form';

import { YourInputWidgetComponent } from './your-input-widget.component';
import { YourCustomWidgetComponent } from './your-custom-widget.component';
...
constructor(private widgetLibrary: WidgetLibraryService) { }
...
// Replace existing 'input' widget:
widgetLibrary.registerWidget('input', YourInputWidgetComponent);
// Add new 'custom-control' widget:
widgetLibrary.registerWidget('custom-control', YourCustomWidgetComponent);
```

To see many examples of widgets, explore the source code, or call `getAllWidgets()` to see all widgets currently available in the library. All default widget components are in the `/src/widgets` folder, and all custom Material Design widget components are in the `/src/frameworks/material-design` folder.

### Changing or adding frameworks

To change the active framework, load the `FrameworkLibraryService` and call `setFramework(yourCustomFramework)` with either the name of an available framework (by default 'no-framework', 'bootstrap-3' or 'material-design'), or with your own custom framework object in the following format:

```javascript
import { FrameworkLibraryService } from 'angular2-json-schema-form';
...
constructor(private frameworkLibrary: FrameworkLibraryService) { }
...
let yourCustomFramework = {
  framework: YourFrameworkComponent,                        // required
  widgets:     { 'your-widget-name': YourWidgetComponent }, // optional
  stylesheets: [ '//url-to-your-external-style-sheet' ],    // optional
  scripts:     [ '//url-to-your-external-script' ]          // optional
}
frameworkLibrary.setFramework(yourCustomFramework);
```

The value of the required `framework` key is an Angular 2 component which will be called to format each widget before it is displayed. The optional `widgets` object contains any custom widgets which will override or supplement the built-in widgets. Also, and the `stylesheets` and `scripts` arrays may contain URLs to any supplemental external style sheets and JavaScript libraries to load.

#### Loading external assets required by a framework

Most large framework libraries (including both Bootstrap and Material Design) need additional external JavaScript and/or CSS assets loaded in order to work properly. The best practice is to load these assets separately in your site, before calling Angular 2 JSON Schema Form. Follow these links for information about installing [Bootstrap](http://getbootstrap.com/getting-started/) and [Material Design](https://github.com/angular/material2/blob/master/GETTING_STARTED.md).

Alternately, during development, you may find it helpful to let Angular 2 JSON Schema Form load these resources for you (as wed did in the 'Basic use' example, above), which you can do in several ways:

* Call `setFramework` with a second parameter of `true` (e.g. `setFramework('material-design', true)`), or
* Add `loadExternalAssets: true` to your `options` object, or
* Add `loadExternalAssets="true"` to your `<json-schema-form>` tag, as shown above.

Finally, if you want to find what scripts a particular framework will automatically load, you can call `getFrameworkStylesheets()` and `getFrameworkScritps()` to return the built-in arrays of URLs.

However, once you start developing more complex sites, you should load these assets separately and remove all references to `loadExternalAssets` to prevent the assets from being loaded twice.

#### Two strategies for writing your own frameworks

The two built-in frameworks (both in the `/src/frameworks` folder) demonstrate different strategies for how frameworks can style form elements. The Bootstrap 3 framework is very lightweight and includes no additional widgets (though it does load some external stylesheets and scripts) and works entirely by adding styles to the default widgets. In contrast, the Material Design framework makes much more drastic changes, and uses the [Material Design for Angular 2](https://github.com/angular/material2) library (which must also be loaded into the application separately, as described above) to replace most of the default form control widgets with custom widgets from that library.

## Contributions and future development

If you find this library useful, I'd love to hear from you. If you have any trouble with it or would like to request a feature, please post a bug report [here](https://github.com/dschnelldavis/angular2-json-schema-form/issues). If you've made any improvements, please post a pull request [here](https://github.com/dschnelldavis/angular2-json-schema-form/pulls), so I can share your improvements with everyone else who uses this library.

I wrote this library because I needed a JSON Schema Form builder to use in a large Angular 2 project I am currently working on. Though I found excellent libraries for Angular 1, React, and jQuery (all linked above), I could not find anything similar for Angular 2—so I wrote this library to fill that gap. The current version is mostly functional, and even includes a few enhancements not available in some other libraries, such as supporting less common JSON Schema features like `oneOf`, `allOf`, and `$ref` links (including circular links). However, it still has several bugs, such as not dynamically enabling and disabling conditionally required fields inside objects, and it's fragile, because it does not yet include any testing framework. Hopefully all these issues will get fixed eventually, but as I'm just a single busy programmer, I can't guarantee how long it will take. In the meantime, I hope you find it useful, and if you do, please send me your feedback.

Thanks! I hope you enjoy using this library as much as I enjoyed writing it. :-)

# License

[MIT](/LICENSE)
