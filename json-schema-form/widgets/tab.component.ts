import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'tab-widget',
  template: ``,
})
export class TabComponent implements OnInit {
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
  }
}
