# BirthdayWebsite

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Personalizing Ella's birthday page

The four full-screen sections, memory photos, letter paragraphs, and favorites are defined in `src/app/pages/home/home.ts` and `src/app/pages/home/home.html`. Replace the sample text and image URLs with your own.

The audio files in `src/assets/` are used as hidden background music:

- `Happy Birthday Instrumental.mp3` plays on **Ella's 25th** and **The Letter**.
- `Paraluman - Adie [Minus One] HQ.mp3` plays on **Our Moments** and **The Little Things**.

The hidden audio starts at 20% volume and is configured unmuted. The same song continues uninterrupted between **Ella's 25th** and **The Letter**, and between **Our Moments** and **The Little Things**; switching between those pairs changes the track and starts it from the beginning. Browsers may still block autoplay until the visitor interacts with the page; the sound button can be used to start or mute playback. No embedded player is shown.

## Publishing to GitHub Pages

The included GitHub Actions workflow builds and deploys the site whenever you push to `main` or `master`.

1. Sign in to GitHub as **`happybirthdaymylove`** and create a repository named **`happybirthdaymylove.github.io`**. This exact owner and repository name are required for the site address `https://happybirthdaymylove.github.io/`.
2. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions**.
3. Connect this local project to the new repository and push the `main` branch:

   ```bash
   git remote add origin https://github.com/happybirthdaymylove/happybirthdaymylove.github.io.git
   git branch -M main
   git push -u origin main
   ```

   If `origin` is already configured, update it with `git remote set-url origin https://github.com/happybirthdaymylove/happybirthdaymylove.github.io.git` instead of adding it again.
4. In the repository's **Actions** tab, wait for **Deploy to GitHub Pages** to finish. The site will then be available at `https://happybirthdaymylove.github.io/`.

The photos, letter, and audio files in this repository will be publicly accessible when the site is published. Make sure you have permission to share them publicly.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
