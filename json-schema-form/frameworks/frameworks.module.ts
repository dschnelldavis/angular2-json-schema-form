import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule }  from '@angular/forms';

import { NoFrameworkComponent } from './no-framework.component';
import { Bootstrap3Component } from './bootstrap3.component';
import { Bootstrap4Component } from './bootstrap4.component';
import { Foundation6Component } from './foundation6.component';
import { MaterialDesignComponent } from './material-design.component';
import { FrameworkLibraryService } from './framework-library.service';

export let frameworkList = [
  NoFrameworkComponent, Bootstrap3Component, Bootstrap4Component,
  Foundation6Component, MaterialDesignComponent
];

@NgModule({
  imports: [ BrowserModule, ReactiveFormsModule ],
  declarations: frameworkList,
  entryComponents: frameworkList,
  exports: frameworkList,
  providers: [ FrameworkLibraryService ]
})
export class FrameworksModule { }
