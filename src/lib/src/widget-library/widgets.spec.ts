import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, Component, NgModule, Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs/Subject';

import { JsonSchemaFormService, Framework } from '../..';

import {
    AddReferenceComponent, ButtonComponent, CheckboxComponent, CheckboxesComponent,
    FileComponent, HiddenComponent, InputComponent, MessageComponent, NoneComponent, NumberComponent,
    OneOfComponent, RadiosComponent, RootComponent, SectionComponent,
    SelectFrameworkComponent, SelectWidgetComponent, SelectComponent, SubmitComponent,
    TabComponent, TabsComponent, TemplateComponent, TextareaComponent,
    BASIC_WIDGETS, Widget
} from '.';

@Component({
    selector: 'test-component',
    template: '<div>Hello World</div>'
})
class TestComponent {}

@Injectable()
class TestFramework extends Framework {
  name = 'TestFramework';
  framework = TestComponent;
};

@NgModule({
    imports: [ CommonModule ],
    declarations: [ TestComponent ],
    entryComponents: [ TestComponent ],
    providers: [
        { provide: Framework, useClass: TestFramework, multi: true }
    ]
})
class TestModule {}

describe('widgets', () => {
    let fixture: ComponentFixture<any>;
    let mockFormService: JsonSchemaFormService;

    function setupComponent<A extends Widget>(clazz: new (...args: any[]) => A, onBeforeInit: Function = (comp: A) => {}): A {
        fixture = TestBed.createComponent(clazz);

        const component = fixture.componentInstance;
        component.layoutNode = {};
        component.layoutIndex = [0];
        component.dataIndex = [];
        component.jsf.formOptions = {};

        if (!onBeforeInit(component)) {
            fixture.detectChanges();
        }

        return component;
    }

    beforeEach(async(() => {
        mockFormService = jasmine.createSpyObj('JsonSchemaFormService', {
            addItem: undefined,
            evaluateCondition: true,
            getFormControl: null,
            getFormControlValue: null,
            getParentNode: {},
            initializeControl: undefined,
            setArrayItemTitle: '',
            setItemTitle: '',
            updateArrayCheckboxList: undefined,
            updateValue: undefined
        });
        (<jasmine.Spy>mockFormService.initializeControl).and.callFake((comp) => {
            comp.options = comp.layoutNode.options;
        });

        TestBed.configureTestingModule({
            imports: [ TestModule ],
            declarations: [
                BASIC_WIDGETS
            ],
            providers: [{
                provide: JsonSchemaFormService,
                useValue: mockFormService
            }],
            schemas: [ NO_ERRORS_SCHEMA ]
        })
        .compileComponents();
    }));

    describe('AddReferenceComponent', () => {
        let component: AddReferenceComponent;

        beforeEach(() => {
            component = setupComponent(AddReferenceComponent, (comp) => {
                comp.layoutNode.options = {maxItems: 3};
            });
        });

        it('should show Add button', () => {
            component.layoutNode.arrayItem = false;
            expect(component.showAddButton).toBeTruthy();

            component.layoutNode.arrayItem = true;
            component.layoutIndex = [0, 1, 2];
            expect(component.showAddButton).toBeTruthy();
        });

        it('should hide Add button', () => {
            component.layoutNode.arrayItem = true;
            component.layoutIndex = [0, 1, 2, 3, 4];
            expect(component.showAddButton).toBeFalsy();
        });

        it('should return button text from parent', () => {
            (<jasmine.Spy>mockFormService.getParentNode).and.returnValue({add: 'test'});
            expect(component.buttonText).toEqual('test');
            expect(mockFormService.setArrayItemTitle).not.toHaveBeenCalled();
        });

        it('should call jsf to get button text', () => {
            component.itemCount = 2;
            (<jasmine.Spy>mockFormService.setArrayItemTitle).and.returnValue('test');
            expect(component.buttonText).toEqual('test');
            expect(mockFormService.setArrayItemTitle).toHaveBeenCalledWith({
                dataIndex: [],
                layoutIndex: [],
                layoutNode: {}
            }, component.layoutNode, component.itemCount);
        });

        it('should call serve to add item', () => {
            component.addItem(jasmine.createSpyObj('event', ['preventDefault']));

            expect(mockFormService.addItem).toHaveBeenCalledWith(component);
        });
    });

    describe('ButtonComponent', () => {
        let component: ButtonComponent;

        beforeEach(() => {
            component = setupComponent(ButtonComponent);
        });

        it('should use the default update method when no click handler', () => {
            component.updateValue({target: {value: null}});
            expect(mockFormService.updateValue).toHaveBeenCalledWith(component, null);
        });

        it('should use click handler from options', () => {
            component.options.onClick = jasmine.createSpy('onclick');
            component.updateValue({target: {value: null}});
            expect(mockFormService.updateValue).not.toHaveBeenCalled();
            expect(component.options.onClick).toHaveBeenCalledWith({target: {value: null}});
        });
    });

    describe('CheckboxComponent', () => {
        let component: CheckboxComponent;

        beforeEach(() => {
            component = setupComponent(CheckboxComponent, (comp) => {
                comp.controlValue = true;

                return true;
            });
        });

        it('should return true for checked', () => {
            fixture.detectChanges();
            (<jasmine.Spy>mockFormService.getFormControlValue).and.returnValue(true);
            expect(component.isChecked).toBeTruthy();
        });

        it('should return false for checked', () => {
            fixture.detectChanges();
            (<jasmine.Spy>mockFormService.getFormControlValue).and.returnValue(false);
            expect(component.isChecked).toBeFalsy();
        });

        it('should call jsf to update value', () => {
            fixture.detectChanges();
            component.updateValue({target: {checked: true}, preventDefault: jasmine.createSpy('0')});
            expect(mockFormService.updateValue).toHaveBeenCalledWith(component, true);

            component.updateValue({target: {}, preventDefault: jasmine.createSpy('1')});
            expect(mockFormService.updateValue).toHaveBeenCalledWith(component, false);
        });

        it('should set controlValue via options', () => {
            component.layoutNode.options = {
                title: 'test'
            };
            component.controlValue = null;
            fixture.detectChanges();
            expect(component.controlValue).toEqual('test');
        });
    });

    describe('CheckboxesComponent', () => {
        let component: CheckboxesComponent;

        beforeEach(() => {
            component = setupComponent(CheckboxesComponent, (comp) => {
                comp.controlValue = true;
                comp.layoutNode.options = {titleMap: [
                    {value: 'check1', name: 'Test1'},
                    {value: 'check2', name: 'Test2'}
                ]};

                return true;
            });
            (<jasmine.Spy>mockFormService.getFormControl).and.returnValue({value: ['check1']});
        });

        it('should have vertical orietation by default', () => {
            fixture.detectChanges();
            expect(component.layoutOrientation).toEqual('vertical');
        });

        it('should set orientation to horizontal', () => {
            component.layoutNode.type = 'checkboxes-inline';
            fixture.detectChanges();
            expect(component.layoutOrientation).toEqual('horizontal');
        });

        it('should initialize values in titleMap list', () => {
            component.boundControl = true;
            fixture.detectChanges();
            expect(component.checkboxList).toEqual([{
                name: 'Test1',
                value: 'check1',
                checked: true
            }, {
                name: 'Test2',
                value: 'check2',
                checked: false
            }]);
        });

        it('should update value in titleMap list', () => {
            component.boundControl = true;
            fixture.detectChanges();
            component.updateValue({target: {value: 'check2', checked: true}});
            expect(component.checkboxList).toEqual([{
                name: 'Test1',
                value: 'check1',
                checked: true
            }, {
                name: 'Test2',
                value: 'check2',
                checked: true
            }]);
        });

        it('should not call service to update control', () => {
            fixture.detectChanges();
            component.boundControl = false;
            component.updateValue({target: {}});
            expect(mockFormService.updateArrayCheckboxList).not.toHaveBeenCalled();
        });

        it('should call service to update bound control', () => {
            fixture.detectChanges();
            component.boundControl = true;
            component.updateValue({target: {}});
            expect(mockFormService.updateArrayCheckboxList).toHaveBeenCalledWith(component, component.checkboxList);
        });
    });

    describe('FileComponent', () => {
        let component: FileComponent;

        beforeEach(() => {
            component = setupComponent(FileComponent);
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
        });
    });

    describe('HiddenComponent', () => {
        let component: HiddenComponent;

        beforeEach(() => {
            component = setupComponent(HiddenComponent);
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
        });
    });

    describe('InputComponent', () => {
        let component: InputComponent;

        beforeEach(() => {
            component = setupComponent(InputComponent);
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
        });
    });

    describe('MessageComponent', () => {
        let component: MessageComponent;

        beforeEach(() => {
            component = setupComponent(MessageComponent, (comp) => {
                comp.layoutNode.options = {
                    help: 'Help',
                    helpvalue: 'HelpValue',
                    msg: 'Msg',
                    message: 'Message'
                };

                return true;
            });
        });

        it('should set message to options.help', () => {
            fixture.detectChanges();
            expect(component.message).toEqual(component.options.help);
        });

        it('should set message to options.helpvalue', () => {
            component.layoutNode.options.help = null;
            fixture.detectChanges();
            expect(component.message).toEqual(component.options.helpvalue);
        });

        it('should set message to options.msg', () => {
            component.layoutNode.options.help = component.layoutNode.options.helpvalue = null;
            fixture.detectChanges();
            expect(component.message).toEqual(component.options.msg);
        });

        it('should set message to options.message', () => {
            component.layoutNode.options.help = component.layoutNode.options.helpvalue = component.layoutNode.options.msg = null;
            fixture.detectChanges();
            expect(component.message).toEqual(component.options.message);
        });
    });

    describe('NoneComponent', () => {
        let component: NoneComponent;

        beforeEach(() => {
            component = setupComponent(NoneComponent);
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
        });
    });

    describe('NumberComponent', () => {
        let component: NumberComponent;

        beforeEach(() => {
            component = setupComponent(NumberComponent);
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
        });
    });

    describe('OneOfComponent', () => {
        let component: OneOfComponent;

        beforeEach(() => {
            component = setupComponent(OneOfComponent);
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
        });
    });

    describe('RadiosComponent', () => {
        let component: RadiosComponent;

        beforeEach(() => {
            component = setupComponent(RadiosComponent, (comp) => {
                comp.layoutNode.options = {titleMap: [
                    {value: 'radio1', name: 'Test1'},
                    {value: 'radio2', name: 'Test2'}
                ], required: true};

                return true;
            });
        });

        it('should set orientation to horizontal', () => {
            component.layoutNode.type = 'radios-inline';
            fixture.detectChanges();
            expect(component.layoutOrientation).toEqual('horizontal');
        });

        it('should initialize values in titleMap list', () => {
            fixture.detectChanges();
            expect(component.radiosList).toEqual([{
                name: 'Test1',
                value: 'radio1'
            }, {
                name: 'Test2',
                value: 'radio2'
            }]);
        });
    });

    describe('RootComponent', () => {
        let component: RootComponent;

        beforeEach(() => {
            component = setupComponent(RootComponent);
            component.dataIndex = [2];
        });

        it('should be draggable', () => {
            component.isOrderable = true;

            expect(component.isDraggable({
                arrayItem: true,
                type: 'number',
                arrayItemType: 'list'
            })).toBeTruthy();

            component.isOrderable = undefined;

            expect(component.isDraggable({
                arrayItem: true,
                type: 'number',
                arrayItemType: 'list'
            })).toBeTruthy();
        });

        it('should NOT be draggable', () => {
            component.isOrderable = false;

            expect(component.isDraggable({
                arrayItem: true,
                type: 'number',
                arrayItemType: 'list'
            })).toBeFalsy();

            component.isOrderable = true;

            expect(component.isDraggable({
                arrayItem: false,
                type: 'number',
                arrayItemType: 'list'
            })).toBeFalsy();
            expect(component.isDraggable({
                arrayItem: true,
                type: '$ref',
                arrayItemType: 'list'
            })).toBeFalsy();
            expect(component.isDraggable({
                arrayItem: true,
                type: 'number',
                arrayItemType: 'array'
            })).toBeFalsy();
        });

        it('should get flex attribute from defaults', () => {
            expect(component.getFlexAttribute({}, 'flex-grow')).toEqual('1');
        });

        it('should get flex attribute from base options', () => {
            expect(component.getFlexAttribute({options: {'flex-shrink': '0'}}, 'flex-shrink')).toEqual('0');
        });

        it('should get flex attribute from options.flex', () => {
            expect(component.getFlexAttribute({options: {flex: '1 1 200px'}}, 'flex-basis')).toEqual('200px');
        });

        it('should show widget', () => {
            (<jasmine.Spy>mockFormService.evaluateCondition).and.returnValue(true);
            expect(component.showWidget({})).toBeTruthy();
            expect(mockFormService.evaluateCondition).toHaveBeenCalledWith({}, component.dataIndex);
        });

        it('should hide widget', () => {
            (<jasmine.Spy>mockFormService.evaluateCondition).and.returnValue(false);
            expect(component.showWidget({})).toBeFalsy();
            expect(mockFormService.evaluateCondition).toHaveBeenCalledWith({}, component.dataIndex);
        });
    });

    describe('SectionComponent', () => {
        let component: SectionComponent;

        beforeEach(() => {
            component = setupComponent(SectionComponent);
        });

        it('should default to div', () => {
            expect(component.containerType).toEqual('div');
        });

        it('should set container type to fieldset', () => {
            ['fieldset', 'array', 'tab', 'advancedfieldset',
            'authfieldset', 'optionfieldset', 'selectfieldset'].forEach((type) => {
                component.containerType = 'div';
                component.layoutNode.type = type;
                component.ngOnInit();
                expect(component.containerType).toEqual('fieldset');
            });
        });

        it('should set default expanded to false', () => {
            component.layoutNode.options = {expanded: false};
            component.ngOnInit();
            expect(component.expanded).toBeFalsy();

            component.layoutNode.options.expanded = undefined;
            component.layoutNode.options.expandable = true;
            component.ngOnInit();
            expect(component.expanded).toBeFalsy();
        });

        it('should NOT toggle the expanded property by default', () => {
            component.toggleExpanded();
            expect(component.expanded).toBeTruthy();
        });

        it('should toggle the expanded property', () => {
            component.options.expandable = true;
            component.toggleExpanded();
            expect(component.expanded).toBeFalsy();
        });

        it('should return null for title', () => {
            component.options.notitle = true;
            expect(component.sectionTitle).toBeNull();
        });

        it('should call service for title', () => {
            (<jasmine.Spy>mockFormService.setItemTitle).and.returnValue('Hi');
            expect(component.sectionTitle).toEqual('Hi');
        });

        describe('getFlexAttribute', () => {
            it('should return null', () => {
                expect(component.getFlexAttribute('is-flex')).toBeNull();
            });

            it('should return undefined', () => {
                expect(component.getFlexAttribute('flex')).toBeUndefined();
            });

            it('should return is-flex as true', () => {
                component.layoutNode.type = 'flex';
                expect(component.getFlexAttribute('is-flex')).toBeTruthy();

                component.layoutNode = {};
                component.options.displayFlex = true;

                expect(component.getFlexAttribute('is-flex')).toBeTruthy();

                component.options.displayFlex = undefined;
                component.options.display = 'flex';

                expect(component.getFlexAttribute('is-flex')).toBeTruthy();
            });

            it('should return is-flex as false', () => {
                expect(component.getFlexAttribute('is-flex')).toBeFalsy();
            });

            it('should resolve display as flex', () => {
                component.layoutNode.type = 'flex';
                expect(component.getFlexAttribute('display')).toEqual('flex');
            });

            it('should resolve display as initial', () => {
                expect(component.getFlexAttribute('display')).toEqual('initial');
            });

            it('should resolve flex-direction and flex-wrap with defaults', () => {
                component.layoutNode.type = 'flex';
                expect(component.getFlexAttribute('flex-direction')).toEqual('column');
                expect(component.getFlexAttribute('flex-wrap')).toEqual('nowrap');
            });

            it('should resolve flex-direction and flex-wrap with options', () => {
                component.layoutNode.type = 'flex';
                component.options = {
                    'flex-direction': 'row',
                    'flex-wrap': 'wrap'
                };
                expect(component.getFlexAttribute('flex-direction')).toEqual('row');
                expect(component.getFlexAttribute('flex-wrap')).toEqual('wrap');
            });

            it('should resolve flex-direction and flex-wrap with flex-flow', () => {
                component.layoutNode.type = 'flex';
                component.options = {
                    'flex-flow': 'row wrap'
                };
                expect(component.getFlexAttribute('flex-direction')).toEqual('row');
                expect(component.getFlexAttribute('flex-wrap')).toEqual('wrap');
            });

            it('should resolve justify-content, align-items, align-content', () => {
                component.layoutNode.type = 'flex';
                component.options = {
                    'justify-content': 'flex-start',
                    'align-items': 'flex-end',
                    'align-content': 'center'
                };
                expect(component.getFlexAttribute('justify-content')).toEqual('flex-start');
                expect(component.getFlexAttribute('align-items')).toEqual('flex-end');
                expect(component.getFlexAttribute('align-content')).toEqual('center');
            });
        });
    });

    describe('SelectFrameworkComponent', () => {
        let component: SelectFrameworkComponent;

        beforeEach(() => {
            component = setupComponent(SelectFrameworkComponent, (comp) => {
                comp['jsf'].framework = TestComponent;
            });
        });

        it('should instantiate framework', () => {
            expect(component.newComponent.componentType).toEqual(TestComponent);
        });
    });

    describe('SelectWidgetComponent', () => {
        let component: SelectWidgetComponent;

        beforeEach(() => {
            component = setupComponent(SelectWidgetComponent, (comp) => {
                comp.layoutNode.widget = TestComponent;
            });
        });

        it('should instantiate widget', () => {
            expect(component.newComponent.componentType).toEqual(TestComponent);
        });
    });

    describe('SelectComponent', () => {
        let component: SelectComponent;

        beforeEach(() => {
            component = setupComponent(SelectComponent, (comp) => {
                comp.layoutNode.options = {titleMap: [
                    {value: 'option1', name: 'Test1'},
                    {value: 'option2', name: 'Test2'}
                ], required: true};
            });
        });

        it('should initialize values in titleMap list', () => {
            expect(component.selectList).toEqual([{
                name: 'Test1',
                value: 'option1'
            }, {
                name: 'Test2',
                value: 'option2'
            }]);
        });
    });

    describe('SubmitComponent', () => {
        let component: SubmitComponent;

        beforeEach(() => {
            component = setupComponent(SubmitComponent, (comp) => {
                comp.layoutNode.type = 'submit';
                comp['jsf'].isValidChanges = new Subject<boolean>();

                return true;
            });
        });

        it('should set controlDisabled to options.disabled', () => {
            component.layoutNode.options = {disabled: true};
            fixture.detectChanges();
            expect(component.controlDisabled).toBeTruthy();
        });

        it('should set controlDisabled to form valid state', () => {
            component['jsf'].formOptions.disableInvalidSubmit = true;
            component['jsf'].isValid = false;
            fixture.detectChanges();
            expect(component.controlDisabled).toBeTruthy();
            component['jsf'].isValidChanges.next(true);
            expect(component.controlDisabled).toBeFalsy();
        });

        it('should set controlValue to options.title', () => {
            component.controlValue = null;
            component.layoutNode.options = {title: 'Submit'};
            fixture.detectChanges();
            expect(component.controlValue).toEqual('Submit');
        });
    });

    describe('TabComponent', () => {
        let component: TabComponent;

        beforeEach(() => {
            component = setupComponent(TabComponent, (comp) => {
                comp.layoutNode.options = {items: []};
            });
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
            expect(component.options).toEqual({items: []});
        });
    });

    describe('TabsComponent', () => {
        let component: TabsComponent;

        beforeEach(() => {
            component = setupComponent(TabsComponent, (comp) => {
                comp.layoutNode.items = [{options: {}}];
            });
        });

        it('should call service to setTitle', () => {
            (<jasmine.Spy>mockFormService.setArrayItemTitle).and.returnValue('Hello');
            expect(component.setTabTitle({x: 0}, 2)).toEqual('Hello');
            expect(mockFormService.setArrayItemTitle).toHaveBeenCalledWith(component, {x: 0}, 2);
        });

        it('should show tab', () => {
            component.showAddTab = false;
            component.layoutNode.items[0].type = 'number';
            component.updateControl();
            expect(component.showAddTab).toBeTruthy();
        });

        it('should show tab', () => {
            component.showAddTab = false;
            component.layoutNode.items[0].type = '$ref';
            component.updateControl();
            expect(component.showAddTab).toBeTruthy();
        });

        it('should NOT show tab', () => {
            component.showAddTab = true;
            component.layoutNode.items[0].type = '$ref';
            component.layoutNode.items[0].options.maxItems = 1;
            component.itemCount = 1;
            component.updateControl();
            expect(component.showAddTab).toBeFalsy();
        });

        it('should call service to select tab', () => {
            component.layoutNode.items[0].type = '$ref';
            component.select(0);
            expect(component.selectedItem).toEqual(0);
            expect(mockFormService.addItem).toHaveBeenCalledWith({
                layoutNode: component.layoutNode.items[0],
                layoutIndex: [0, 0],
                dataIndex: [0]
            });
            expect(component.itemCount).toEqual(1);
        });

        it('should NOT call service to show existing tab', () => {
            component.select(0);
            expect(component.selectedItem).toEqual(0);
            expect(mockFormService.addItem).not.toHaveBeenCalled();
        });
    });

    describe('TemplateComponent', () => {
        let component: TemplateComponent;

        beforeEach(() => {
            component = setupComponent(TemplateComponent, (comp) => {
                comp.layoutNode.options = {template: TestComponent};
            });
        });

        it('should instantiate template and set properties', () => {
            expect(component.newComponent.componentType).toEqual(TestComponent);
            expect(component.newComponent.instance.layoutNode).toEqual(component.layoutNode);
            expect(component.newComponent.instance.layoutIndex).toEqual(component.layoutIndex);
            expect(component.newComponent.instance.dataIndex).toEqual(component.dataIndex);
        });

        it('should update component when input changes', () => {
            component.dataIndex = [3];
            component.ngOnChanges();
            expect(component.newComponent.instance.dataIndex).toEqual(component.dataIndex);
        });
    });

    describe('TextareaComponent', () => {
        let component: TextareaComponent;

        beforeEach(() => {
            component = setupComponent(TextareaComponent);
        });

        it('should instantiate', () => {
            expect(component).toBeDefined();
        });
    });
});
