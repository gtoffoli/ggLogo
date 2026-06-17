## ggLogo (Iperlogo 2026) - a new Logo-in-browser implementation

# Project

This is an ongoing project that I began in October 2025 in my spare time, and this is a provisional version of its README.
The idea was to recover some of what I and a few colleagues did between 1980 and 2000+ and to adapt it to a more open operating environment.
In the past I developed all kind of software applications and tools by using mainly C++ and Python;
since I didn't have much experience with JavaScript and was completely new to TypeScript,
I used free versions of some generative AIs to get a ‘helping hand’ in getting this project started.
When, within a few months, the function set will be reasonably complete and the documentation adequate,
I will welcome criticism, collaboration for testing and development
and suggestions for improving the functional specifications and the software architecture.  

# Genealogy

*ggLogo* ha a lot of ancestors; some of them were co-authored by me and my colleague and friend Giovanni Lariccia; I mention a few:
- the original Logo developed ad BBN on behalf of an MIT multidisciplinary research group (1971-1973);
- *sLogo*: an Italian version of Logo, developed by Giovanni Toffoli and Giovanni Lariccia on MsDOS, wit C and C++ (1982-1996);
- *mLogo*: a successor of sLogo, derived from sLogo for the educational branch of the *Arnoldo Mondadori* publisher,
  based on an idea and with the support of Egidio Pentiraro  (1984-1985);
- *MswLogo*: a Microsoft product that we took in part as a comparison term in designing Iperlogo (1995-2002;
- *Iperlogo*: an extended implementation of the Logo language for Windows (1996-2005);
  developed at LINK srl with the collaboration of Mariarosaria Manco and Corrado Mayer;
  it supported multiple graphical windows, editor windows and browser windows;
  initially, the docs folder includes manuals of Iperlogo in Italian;
- *Iperlogo+*: an internal product of LINK srl, with even more extensive functionality (1999-2005);
  besides the traditional Turtle graphics, it supported object graphics based on the *Obective Views* library by *Stingray Software*;
  it is a frozen project, but recently I recovered the (dirty) project files and archived it in https://github.com/gtoffoli/iperlogo;
- *jsLogo*: another open-source version of Logo, available on the GitHub repository; see: https://github.com/inexorabletash/jslogo.

# Features

- stand-alone - can be run locally, without an Internet connection;
- multilingual - by design: initial support for Italian and English at the level of primitive names and user interface;
- compatibility - the English terminology should be fairly compatible with MswLogo, Terrapin Logo and jsLogo;
  the Italian terminology should be highly compatible with sLogo and Iperlogo;
- extensions - support if foreseen for most of the music functionality of *Terrapin Logo* (MIDI emulation)
  and for the Bluetooth protocol to control near-field devices such as a popular LED matrix display.

# Deployment

Currently Iperlogo 2026 is being tested at localhost with the Chrome and Firefox browsers on:
- a Windows 11 desktop; console command: python -m http.server; web address: http://localhost:3000/
- an Android smartphone, using the Simple HTTP Server app and an optional icon created with the Shortcut Maker app.

In both cases, the deployment requires only the download of a compact bundle produced with Bun.

# bun-react-template

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
