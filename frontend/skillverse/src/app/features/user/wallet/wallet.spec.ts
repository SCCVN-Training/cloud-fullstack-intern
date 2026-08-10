import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { Wallet } from './wallet';

describe('Wallet', () => {
  let component: Wallet;
  let fixture: ComponentFixture<Wallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wallet],
      providers: [[provideRouter([])]],
    }).compileComponents();

    fixture = TestBed.createComponent(Wallet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct initial balance', () => {
    expect(component.balance).toBe(1250);
  });

  it('should contain two activity groups', () => {
    expect(component.activities.length).toBe(2);
  });

  it('should render the balance', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('1,250');
    expect(compiled.textContent).toContain('Skill Coins');
  });

  it('should render all activity groups', () => {
    const headers = fixture.debugElement.queryAll(By.css('.list-header'));

    expect(headers.length).toBe(2);
    expect(headers[0].nativeElement.textContent).toContain('Today');
    expect(headers[1].nativeElement.textContent).toContain('Yesterday');
  });

  it('should render all transaction items', () => {
    const items = fixture.debugElement.queryAll(By.css('.transaction-item'));

    expect(items.length).toBe(4);
  });

  it('should render the correct transaction titles', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Advanced UI Design Coaching');
    expect(compiled.textContent).toContain('Business Spanish Workshop');
    expect(compiled.textContent).toContain('Coin Pack: Professional Booster');
    expect(compiled.textContent).toContain('Community Badge Awarded');
  });

  it('should identify positive transactions', () => {
    const positiveTransactions = component.activities
      .flatMap((group) => group.items)
      .filter((item) => item.isPositive === true);

    expect(positiveTransactions.length).toBe(2);
  });

  it('should identify negative transactions', () => {
    const negativeTransactions = component.activities
      .flatMap((group) => group.items)
      .filter((item) => item.isPositive === false);

    expect(negativeTransactions.length).toBe(1);
  });

  it('should identify neutral transactions', () => {
    const neutralTransactions = component.activities
      .flatMap((group) => group.items)
      .filter((item) => item.isPositive === null);

    expect(neutralTransactions.length).toBe(1);
  });

  it('should display the correct balance amount', () => {
    const balanceElement = fixture.nativeElement.querySelector('.gradient-text') as HTMLElement;

    expect(balanceElement.textContent?.trim()).toBe('1,250');
  });

  it('should render the search input', () => {
    const input = fixture.debugElement.query(By.css('input'));

    expect(input).toBeTruthy();
    expect(input.nativeElement.placeholder).toBe('Search activity...');
  });

  it('should render filter tabs', () => {
    const tabs = fixture.debugElement.queryAll(By.css('.tab-btn'));

    expect(tabs.length).toBe(4);

    expect(tabs[0].nativeElement.textContent).toContain('All Activity');
    expect(tabs[1].nativeElement.textContent).toContain('Earnings');
    expect(tabs[2].nativeElement.textContent).toContain('Spent');
    expect(tabs[3].nativeElement.textContent).toContain('System');
  });

  it('should render the load older activity button', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Load older activity');
  });
});
