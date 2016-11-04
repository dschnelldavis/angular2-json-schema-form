import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'tabarray-widget',
  template: ``,
})
export class TabarrayComponent implements OnInit {
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
  }
}
