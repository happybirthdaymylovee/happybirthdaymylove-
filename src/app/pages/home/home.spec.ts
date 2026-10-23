import { HomeComponent } from './home';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('should use the birthday instrumental for the first two sections and Paraluman for the last two', () => {
    expect(component.audioTracks.letter).toEqual(component.audioTracks.hero);
    expect(component.audioTracks.hero).toMatchObject({
      src: '/assets/Happy%20Birthday%20Instrumental.mp3',
      title: 'Elegant birthday instrumental',
    });
    expect(component.audioTracks.moments).toMatchObject({
      src: '/assets/Paraluman%20-%20Adie%20%5BMinus%20One%5D%20HQ.mp3',
      title: 'Paraluman (minus one) by Adie',
    });
    expect(component.audioTracks.details).toEqual(component.audioTracks.moments);
  });

  it('should start unmuted with background music at 20% volume', () => {
    expect(component.isMuted).toBe(false);
    expect(component.backgroundMusicVolume).toBe(0.2);
  });

  it('should activate a section as soon as its navigation link is selected', () => {
    const section = document.createElement('section');
    section.id = 'moments';
    document.body.append(section);
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockReturnValue(1);
    const event = { preventDefault: vi.fn() } as unknown as MouseEvent;

    try {
      component.scrollToSection(event, 'moments');

      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(component.activeSection).toBe('moments');
    } finally {
      section.remove();
      requestAnimationFrame.mockRestore();
    }
  });

  it('should adjust music volume in 20 percent steps and clamp it to the supported range', () => {
    component.changeVolume(1);
    expect(component.volumePercent).toBe(40);

    component.changeVolume(-1);
    expect(component.volumePercent).toBe(20);

    component.changeVolume(-1);
    expect(component.volumePercent).toBe(0);
    expect(component.isMuted).toBe(true);

    component.changeVolume(-1);
    expect(component.volumePercent).toBe(0);

    component.changeVolume(1);
    expect(component.volumePercent).toBe(20);
    expect(component.isMuted).toBe(false);

    for (let step = 0; step < 5; step += 1) {
      component.changeVolume(1);
    }
    expect(component.volumePercent).toBe(100);

    component.changeVolume(1);
    expect(component.volumePercent).toBe(100);
  });

  it('should provide landscape photo metadata for memory lane', () => {
    const imageNumbers = [
      ...Array.from({ length: 24 }, (_, index) => index + 1),
      ...Array.from({ length: 10 }, (_, index) => index + 26),
    ];

    expect(component.memories).toHaveLength(34);
    expect(component.memories.map((memory) => memory.url)).toEqual(
      imageNumbers.map((imageNumber) => `/assets/${imageNumber}.jpg`),
    );
    expect(component.carouselDelayMs).toBe(3000);
    expect(component.memories.every((memory) => memory.url && memory.caption && memory.alt)).toBe(
      true,
    );
  });

  it('should provide editable letter and favorites content', () => {
    expect(component.letterParagraphs.length).toBeGreaterThan(0);
    expect(component.favorites.length).toBeGreaterThan(0);
  });

  it('should display the reactive age in the letter opening', () => {
    const countdown = component.birthdayCountdown();
    component.birthdayCountdown.set({ ...countdown, age: 25 });
    fixture.detectChanges();

    const letterParagraph = fixture.nativeElement.querySelector('.letter-paragraph');
    expect(letterParagraph.textContent).toContain('25 years of your life');
  });

  it('should calculate her current age and next birthday countdown from October 28, 2001', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 12));
    const beforeBirthday = new HomeComponent();

    expect(beforeBirthday.birthdayCountdown()).toMatchObject({
      age: 24,
      nextBirthdayAge: 25,
      days: 5,
      hours: 12,
    });
    expect(beforeBirthday.birthdayDateLabel).toBe('October 28');

    vi.setSystemTime(new Date(2026, 9, 28));
    const onBirthday = new HomeComponent();
    expect(onBirthday.birthdayCountdown()).toMatchObject({
      age: 25,
      nextBirthdayAge: 26,
    });
    expect(onBirthday.ageLabel(25)).toBe('25th');
    expect(onBirthday.ageLabel(26)).toBe('26th');
  });

  it('should update completed years together on the July 10 anniversary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 9, 12));
    const beforeAnniversary = new HomeComponent();
    expect(beforeAnniversary.relationshipYears()).toBe(4);

    vi.setSystemTime(new Date(2026, 6, 10, 12));
    const onAnniversary = new HomeComponent();
    expect(onAnniversary.relationshipYears()).toBe(5);
  });

  it('should position nearby carousel cards with the active memory largest', () => {
    expect(component.getMemoryOffset(0)).toBe(0);
    expect(component.getMemoryOffset(1)).toBe(1);
    expect(component.getMemoryOffset(33)).toBe(-1);
    expect(component.getCarouselTransform(0)).toContain('scale(1)');
    expect(component.getCarouselTransform(1)).toContain('scale(0.78)');
    expect(component.getCarouselTransform(2)).toContain('scale(0.58)');
    expect(component.getCarouselLeftPercent(0)).toBe(50);
    expect(component.getCarouselLeftPercent(1)).toBe(77);
    expect(component.getCarouselLeftPercent(-1)).toBe(23);

    component.showNextMemory();
    expect(component.activeMemoryIndex()).toBe(1);
    expect(component.getMemoryOffset(1)).toBe(0);
    expect(component.getMemoryOffset(0)).toBe(-1);
    expect(component.getMemoryOffset(2)).toBe(1);

    component.showPreviousMemory();
    expect(component.activeMemoryIndex()).toBe(0);
    component.showPreviousMemory();
    expect(component.activeMemoryIndex()).toBe(33);
    expect(component.getMemoryOffset(33)).toBe(0);
    expect(component.getMemoryOffset(0)).toBe(1);
  });

  it('should automatically advance to the next memory after three seconds', () => {
    vi.useFakeTimers();
    try {
      const initialProgressKey = component.carouselProgressKey();
      component.showNextMemory();
      expect(component.activeMemoryIndex()).toBe(1);
      expect(component.carouselProgressKey()).toBe(initialProgressKey + 1);

      vi.advanceTimersByTime(2999);
      expect(component.activeMemoryIndex()).toBe(1);

      vi.advanceTimersByTime(1);
      expect(component.activeMemoryIndex()).toBe(2);
    } finally {
      component.ngOnDestroy();
      vi.useRealTimers();
    }
  });
});
