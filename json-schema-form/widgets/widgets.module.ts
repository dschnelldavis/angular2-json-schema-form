import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule }  from '@angular/forms';

import { ArrayComponent } from './array.component';
import { ButtonComponent } from './button.component';
import { CheckboxComponent } from './checkbox.component';
import { CheckboxesComponent } from './checkboxes.component';
import { FieldsetComponent } from './fieldset.component';
import { FileComponent } from './file.component';
import { HiddenComponent } from './hidden.component';
import { InputComponent } from './input.component';
import { NoneComponent } from './none.component';
import { MessageComponent } from './message.component';
import { RadiosComponent } from './radios.component';
import { RadiosInlineComponent } from './radios-inline.component';
import { RootComponent } from './root.component';
import { SectionComponent } from './section.component';
import { SelectComponent } from './select.component';
import { SubmitComponent } from './submit.component';
import { TabComponent } from './tab.component';
import { TabarrayComponent } from './tabarray.component';
import { TemplateComponent } from './template.component';
import { TextareaComponent } from './textarea.component';

import { WidgetLibraryService } from './widget-library.service';

export let componentList = [
  ArrayComponent, ButtonComponent, CheckboxComponent, CheckboxesComponent,
  FieldsetComponent, FileComponent, HiddenComponent, InputComponent,
  NoneComponent, MessageComponent, RadiosComponent, RadiosInlineComponent,
  RootComponent, SectionComponent, SelectComponent, SubmitComponent,
  TabComponent, TabarrayComponent, TemplateComponent, TextareaComponent
];

@NgModule({
  imports: [ BrowserModule, ReactiveFormsModule ],
  declarations: componentList,
  entryComponents: componentList,
  exports: componentList,
  providers: [ WidgetLibraryService ]
})
export class WidgetsModule { }
