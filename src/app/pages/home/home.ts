import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
} from '@angular/core';

type BirthdaySectionId = 'hero' | 'letter' | 'moments' | 'details';

interface Memory {
  url: string;
  caption: string;
  alt: string;
  date: string;
}

interface AudioTrack {
  src: string;
  title: string;
}

interface BirthdayCountdown {
  age: number;
  nextBirthdayAge: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly birthDate = new Date(2001, 9, 28);
  private readonly anniversaryDate = new Date(2021, 6, 10);

  @ViewChild('audioPlayer', { read: ElementRef })
  private audioPlayer?: ElementRef<HTMLAudioElement>;

  @ViewChildren('pageSection', { read: ElementRef })
  private pageSections!: QueryList<ElementRef<HTMLElement>>;

  readonly audioTracks: Record<BirthdaySectionId, AudioTrack> = {
    hero: {
      src: '/assets/Happy%20Birthday%20Instrumental.mp3',
      title: 'Elegant birthday instrumental',
    },
    letter: {
      src: '/assets/Happy%20Birthday%20Instrumental.mp3',
      title: 'Elegant birthday instrumental',
    },
    moments: {
      src: '/assets/Paraluman%20-%20Adie%20%5BMinus%20One%5D%20HQ.mp3',
      title: 'Paraluman (minus one) by Adie',
    },
    details: {
      src: '/assets/Paraluman%20-%20Adie%20%5BMinus%20One%5D%20HQ.mp3',
      title: 'Paraluman (minus one) by Adie',
    },
  };
  volumePercent = 20;

  get backgroundMusicVolume(): number {
    return this.volumePercent / 100;
  }

  get birthdayDateLabel(): string {
    return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(this.birthDate);
  }

  formatTwoDigits(value: number): string {
    return value.toString().padStart(2, '0');
  }

  readonly memories: Memory[] = Array.from({ length: 35 }, (_, index) => index + 1)
    .filter((imageNumber) => imageNumber !== 25)
    .map((imageNumber) => ({
      url: `/assets/${imageNumber}.jpg`,
      caption: 'A little moment worth keeping.',
      alt: `Memory ${imageNumber} from Ella's photo collection`,
      date: `MEMORY ${String(imageNumber).padStart(2, '0')}`,
    }));
  readonly carouselDelayMs = 3000;
  readonly carouselVisibleRadius = 2;
  readonly viewportWidth = signal(typeof window === 'undefined' ? 0 : window.innerWidth);

  readonly favorites = [
    { label: 'The coffee order', value: 'Spanish Latte, your go to coffee when checking new coffee shops.' },
    {
      label: 'The little things',
      value: 'The way your organize your things and all. You like things neat and organized. ',
    },
    { label: 'The favorites', value: 'Seasons may change, but the only constant favorite of yours is the color pink' },
    { label: 'The best thing', value: 'Getting to do life right beside you, my love.' },
  ];
  readonly birthdayCountdown = signal(this.calculateBirthdayCountdown(new Date()));
  readonly relationshipYears = signal(this.calculateRelationshipYears(new Date()));

  readonly letterParagraphs = [
    'This past year, I have watched you grow with so much courage and grace. I see the battles  you have fought, the challenges you have overcome, and times when you have almost given up. Pero nilabin mo pa din. I am so proud of what you have become, and I am so grateful to be a part of your journey. Your journey shows how much perseverance and determination can lead in life. I was there for everything, even the bad parts. I am just thankful that I was able to help you through of it. Juggling between work school, and personal life is not easy, but you did it.',
    'Now that graduated ka na, and by the time na natapos ko and nakita mo na, natapos ka na din sa board exam. You deserve all the leisures of life it can offer. Pahinga ka muna and enjoy life. For the year ahead, I hope it be kind to you. I hope it brings you new opportunities, new adventures, and new experiences. I hope it brings you happiness, love, and laughter. And I hope I will be there to share in all of it with you. I love you so much, mahal. To the moon, front and back, side to side, and beyond! Happy Birthday, my love!',
  ];

  activeSection: BirthdaySectionId = 'hero';
  readonly activeMemoryIndex = signal(0);
  readonly carouselProgressKey = signal(0);
  isMuted = false;
  audioStatus = 'Starting background music…';

  private sectionObserver?: IntersectionObserver;
  private carouselTimer?: ReturnType<typeof setTimeout>;
  private birthdayTimer?: ReturnType<typeof setInterval>;
  private scrollAnimationFrame?: number;
  private readonly visibleSections = new Map<Element, number>();

  ngAfterViewInit(): void {
    this.setActiveSection('hero', true);
    this.scheduleCarouselAdvance();
    this.birthdayTimer = setInterval(() => this.updateBirthdayCountdown(), 1000);

    if (typeof IntersectionObserver === 'undefined') return;

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visibleSections.set(entry.target, entry.intersectionRatio);
          } else {
            this.visibleSections.delete(entry.target);
          }
        }

        const mostVisible = [...this.visibleSections.entries()].sort((a, b) => b[1] - a[1])[0];
        const sectionId = mostVisible?.[0].getAttribute('data-section') as BirthdaySectionId | null;
        if (sectionId && sectionId in this.audioTracks) {
          this.setActiveSection(sectionId);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const section of this.pageSections) {
      this.sectionObserver.observe(section.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
    this.stopCarouselAutoplay();
    if (this.birthdayTimer) {
      clearInterval(this.birthdayTimer);
    }
    if (this.scrollAnimationFrame !== undefined) {
      cancelAnimationFrame(this.scrollAnimationFrame);
    }
    this.audioElement?.pause();
  }

  scrollToSection(event: MouseEvent, sectionId: BirthdaySectionId): void {
    const section = document.getElementById(sectionId);
    if (!section) return;

    event.preventDefault();
    this.setActiveSection(sectionId);
    if (this.scrollAnimationFrame !== undefined) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = undefined;
    }

    const scrollContainer = document.scrollingElement ?? document.documentElement;
    const startY = scrollContainer.scrollTop;
    const targetY = Math.max(0, startY + section.getBoundingClientRect().top);
    const distance = targetY - startY;
    const duration = Math.min(2200, Math.max(900, Math.abs(distance) * 0.7));
    const startTime = performance.now();
    const easeInOut = (progress: number): number =>
      progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const animateScroll = (currentTime: number): void => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      scrollContainer.scrollTop = startY + distance * easeInOut(progress);

      if (progress < 1) {
        this.scrollAnimationFrame = requestAnimationFrame(animateScroll);
      } else {
        this.scrollAnimationFrame = undefined;
        this.setActiveSection(sectionId);
      }
    };

    this.scrollAnimationFrame = requestAnimationFrame(animateScroll);

    window.history.replaceState(null, '', `#${sectionId}`);
  }

  toggleMute(): void {
    const audio = this.audioElement;
    if (!audio) return;

    if (!this.isMuted) {
      this.isMuted = true;
      audio.muted = true;
      this.audioStatus = 'Music is muted.';
      return;
    }

    this.isMuted = false;
    if (this.volumePercent === 0) {
      this.volumePercent = 20;
    }
    audio.volume = this.backgroundMusicVolume;
    audio.muted = false;
    void this.playActiveTrack();
  }

  changeVolume(step: -1 | 1): void {
    this.volumePercent = Math.min(100, Math.max(0, this.volumePercent + step * 20));
    const audio = this.audioElement;
    if (this.volumePercent === 0) {
      this.isMuted = true;
      if (audio) audio.muted = true;
      this.audioStatus = 'Music is muted.';
      return;
    }

    const wasMuted = this.isMuted;
    this.isMuted = false;
    if (!audio) return;

    audio.volume = this.backgroundMusicVolume;
    audio.muted = false;
    if (wasMuted) {
      void this.playActiveTrack();
    }
  }

  handleAudioError(): void {
    const track = this.audioTracks[this.activeSection];
    this.audioStatus = `Could not load ${track.title}. Check that ${track.src} exists.`;
  }

  ageLabel(age: number): string {
    const lastTwoDigits = age % 100;
    const suffix =
      lastTwoDigits >= 11 && lastTwoDigits <= 13
        ? 'th'
        : age % 10 === 1
          ? 'st'
          : age % 10 === 2
            ? 'nd'
            : age % 10 === 3
              ? 'rd'
              : 'th';
    return `${age}${suffix}`;
  }

  private updateBirthdayCountdown(): void {
    const now = new Date();
    this.birthdayCountdown.set(this.calculateBirthdayCountdown(now));
    this.relationshipYears.set(this.calculateRelationshipYears(now));
  }

  private calculateRelationshipYears(now: Date): number {
    const anniversaryThisYear = new Date(
      now.getFullYear(),
      this.anniversaryDate.getMonth(),
      this.anniversaryDate.getDate(),
    );
    const years = now.getFullYear() - this.anniversaryDate.getFullYear();
    return now >= anniversaryThisYear ? years : years - 1;
  }

  private calculateBirthdayCountdown(now: Date): BirthdayCountdown {
    const thisYearBirthday = new Date(
      now.getFullYear(),
      this.birthDate.getMonth(),
      this.birthDate.getDate(),
    );
    const birthdayHasPassed = now >= thisYearBirthday;
    let age = now.getFullYear() - this.birthDate.getFullYear();

    if (!birthdayHasPassed) {
      age -= 1;
    }

    const nextBirthday = new Date(
      now.getFullYear() + (birthdayHasPassed ? 1 : 0),
      this.birthDate.getMonth(),
      this.birthDate.getDate(),
    );
    const remainingSeconds = Math.max(0, Math.floor((nextBirthday.getTime() - now.getTime()) / 1000));
    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return {
      age,
      nextBirthdayAge: age + 1,
      days,
      hours,
      minutes,
      seconds,
    };
  }

  getMemoryOffset(memoryIndex: number): number {
    const length = this.memories.length;
    const offset = (memoryIndex - this.activeMemoryIndex() + length) % length;
    return offset > Math.floor(length / 2) ? offset - length : offset;
  }

  getCarouselTransform(offset: number): string {
    const distance = Math.abs(offset);
    const scale = distance === 0 ? 1 : distance === 1 ? 0.78 : distance === 2 ? 0.58 : 0.52;
    return `translate(-50%, -50%) scale(${scale})`;
  }

  getCarouselLeftPercent(offset: number): number {
    const step = this.viewportWidth() <= 700 ? 36 : 27;
    return 50 + offset * step;
  }

  @HostListener('window:resize')
  updateViewportWidth(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  isVisibleCarouselSlide(offset: number): boolean {
    return Math.abs(offset) <= this.carouselVisibleRadius;
  }

  isNearCarouselSlide(offset: number): boolean {
    return Math.abs(offset) === 1;
  }

  isFarCarouselSlide(offset: number): boolean {
    return Math.abs(offset) === 2;
  }

  getCarouselZIndex(offset: number): number {
    return Math.max(1, 5 - Math.abs(offset));
  }

  showPreviousMemory(): void {
    this.moveToMemory((this.activeMemoryIndex() - 1 + this.memories.length) % this.memories.length);
  }

  showNextMemory(): void {
    this.moveToMemory((this.activeMemoryIndex() + 1) % this.memories.length);
  }

  selectMemory(index: number): void {
    this.moveToMemory(index);
  }

  private moveToMemory(index: number): void {
    if (index === this.activeMemoryIndex()) return;
    this.activeMemoryIndex.set(index);
    this.scheduleCarouselAdvance();
  }

  private setActiveSection(sectionId: BirthdaySectionId, restart = false): void {
    if (!restart && sectionId === this.activeSection) return;
    const previousTrack = this.audioTracks[this.activeSection];
    this.activeSection = sectionId;
    const track = this.audioTracks[sectionId];
    const audio = this.audioElement;
    if (!audio) return;

    if (!restart && track.src === previousTrack.src) return;

    const sourceChanged = audio.getAttribute('src') !== track.src;
    audio.pause();
    if (sourceChanged) {
      audio.src = track.src;
      audio.load();
    } else {
      audio.currentTime = 0;
    }
    audio.volume = this.backgroundMusicVolume;
    audio.muted = this.isMuted;
    this.audioStatus = this.isMuted ? 'Music is muted.' : `Playing ${track.title}.`;
    void this.playActiveTrack();
  }

  private scheduleCarouselAdvance(): void {
    this.stopCarouselAutoplay();
    this.carouselProgressKey.update((key) => key + 1);

    this.carouselTimer = setTimeout(() => {
      this.carouselTimer = undefined;
      this.showNextMemory();
    }, this.carouselDelayMs);
  }

  private stopCarouselAutoplay(): void {
    if (this.carouselTimer) {
      clearTimeout(this.carouselTimer);
      this.carouselTimer = undefined;
    }
  }

  private async playActiveTrack(): Promise<void> {
    const audio = this.audioElement;
    const track = this.audioTracks[this.activeSection];
    if (!audio) return;

    try {
      await audio.play();
      this.audioStatus = `Playing ${track.title}.`;
    } catch {
      if (audio.error) {
        this.handleAudioError();
      } else {
        this.isMuted = true;
        audio.muted = true;
        this.audioStatus = 'Playback was blocked. Use the sound button to try again.';
      }
    }
  }

  private get audioElement(): HTMLAudioElement | undefined {
    return this.audioPlayer?.nativeElement;
  }
}
