import { NgModule }                         from '@angular/core';
import { CommonModule }                     from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { JsonSchemaFormService }            from '../json-schema-form.service';
import { WidgetLibraryService }             from './widget-library.service';

import { AddReferenceComponent }            from './add-reference.component';
import { ButtonComponent }                  from './button.component';
import { CheckboxComponent }                from './checkbox.component';
import { CheckboxesComponent }              from './checkboxes.component';
import { FieldsetComponent }                from './fieldset.component';
import { FileComponent }                    from './file.component';
import { HiddenComponent }                  from './hidden.component';
import { InputComponent }                   from './input.component';
import { MessageComponent }                 from './message.component';
import { NoneComponent }                    from './none.component';
import { NumberComponent }                  from './number.component';
import { RadiosComponent }                  from './radios.component';
import { RootComponent }                    from './root.component';
import { SectionComponent }                 from './section.component';
import { SelectComponent }                  from './select.component';
import { SelectFrameworkComponent }         from './select-framework.component';
import { SelectWidgetComponent }            from './select-widget.component';
import { SubmitComponent }                  from './submit.component';
import { TabComponent }                     from './tab.component';
import { TabsComponent }                    from './tabs.component';
import { TemplateComponent }                from './template.component';
import { TextareaComponent }                from './textarea.component';

const BASIC_WIDGETS = [
  AddReferenceComponent, ButtonComponent, CheckboxComponent,
  CheckboxesComponent, FieldsetComponent, FileComponent, HiddenComponent,
  InputComponent, MessageComponent, NoneComponent, NumberComponent,
  RadiosComponent, RootComponent, SectionComponent, SelectComponent,
  SelectFrameworkComponent, SelectWidgetComponent, SubmitComponent,
  TabComponent, TabsComponent, TemplateComponent, TextareaComponent
];

@NgModule({
  imports:         [ CommonModule, FormsModule, ReactiveFormsModule ],
  declarations:    [ ...BASIC_WIDGETS ],
  exports:         [ ...BASIC_WIDGETS ],
  entryComponents: [ ...BASIC_WIDGETS ],
  providers:       [ WidgetLibraryService ]
})
export class WidgetLibraryModule { }
