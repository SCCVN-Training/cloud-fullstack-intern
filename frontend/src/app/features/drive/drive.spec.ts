// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { RouterTestingModule } from '@angular/router/testing';

// import { Drive } from './drive';

// describe('Drive', () => {
//   let component: Drive;
//   let fixture: ComponentFixture<Drive>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [Drive, RouterTestingModule],
//     }).compileComponents();

//     fixture = TestBed.createComponent(Drive);
//     component = fixture.componentInstance;
//     await fixture.whenStable();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('computes storage percentage correctly', () => {
//     const used = component.usedStorage();
//     const total = component.totalStorage();
//     const expected = (used / total) * 100;
//     expect(component.storagePercentage()).toBeCloseTo(expected, 6);
//   });

//   it('defaults to home ordering (newest first)', () => {
//     component.currentTab.set('home');
//     const items = component.displayItems();
//     expect(items.length).toBeGreaterThan(0);
//     // Newest date in mockItems is 2026-07-20
//     expect(items[0].updated).toBe('2026-07-20');
//   });

//   it('shows folders first when switched to storage', () => {
//     component.switchTab('storage');
//     const items = component.displayItems();
//     // first items should be folders
//     expect(items[0].type).toBe('folder');
//     // folders should be sorted alphabetically among themselves
//     const folderNames = items
//       .filter((i) => i.type === 'folder')
//       .map((f) => f.name);
//     const sorted = [...folderNames].sort((a, b) => a.localeCompare(b));
//     expect(folderNames).toEqual(sorted);
//   });

//   it('triggers upload workflow (logs to console)', () => {
//     const original = console.log;
//     const calls: any[] = [];
//     (console as any).log = (...args: any[]) => calls.push(args);

//     component.onUploadTrigger();

//     expect(calls.length).toBe(1);
//     expect(calls[0][0]).toBe('Upload workflow triggered');

//     (console as any).log = original;
//   });
// });
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Drive } from './drive';

describe('Drive', () => {
  let component: Drive;
  let fixture: ComponentFixture<Drive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        Drive, // Standalone component imported directly
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Drive);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the drive dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the home tab on initialization', () => {
    expect(component.currentTab()).toBe('home');
  });

  it('should switch tabs correctly and update currentTab signal', () => {
    component.switchTab('storage');
    expect(component.currentTab()).toBe('storage');

    component.switchTab('home');
    expect(component.currentTab()).toBe('home');
  });

  it('should compute the correct storage usage percentage profile', () => {
    component.usedStorage.set(5);
    component.totalStorage.set(20);
    // (5 / 20) * 100 = 25%
    expect(component.storagePercentage()).toBe(25);
  });

  it('should sort items chronologically (newest first) when on the home tab', () => {
    component.switchTab('home');
    const items = component.displayItems();

    // Verify dates descend cleanly: 2026-07-20 -> 2026-07-19 -> 2026-07-18 -> 2026-07-15
    expect(items[0].updated).toBe('2026-07-20');
    expect(items[1].updated).toBe('2026-07-19');
    expect(items[2].updated).toBe('2026-07-18');
    expect(items[3].updated).toBe('2026-07-15');
  });

  it('should bubble folders to the top, then files when on the storage tab', () => {
    component.switchTab('storage');
    const items = component.displayItems();

    // The first two items must be folders based on your specification
    expect(items[0].type).toBe('folder');
    expect(items[1].type).toBe('folder');

    // The last two items must be files
    expect(items[2].type).toBe('file');
    expect(items[3].type).toBe('file');
  });
});
