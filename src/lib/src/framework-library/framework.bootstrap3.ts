import { NgModule } from '@angular/core';
import { Inject, Injectable } from '@angular/core';

import { Framework } from './framework';

import { Bootstrap3FrameworkModule } from './bootstrap-3-framework/bootstrap-3-framework.module';

// Bootstrap 3 Framework
// https://github.com/valor-software/ng2-bootstrap
import { Bootstrap3FrameworkComponent } from './bootstrap-3-framework/bootstrap-3-framework.component';

@Injectable()
export class FrameworkBootstrap3 extends Framework {
    name= 'bootstrap-3'
    framework= Bootstrap3FrameworkComponent
    stylesheets= [
      '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
      '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css',
    ]
    scripts= [
      '//ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js',
      '//ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js',
      '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
    ]
}

