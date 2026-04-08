# Zork III: Mobile

A modern, mobile-first web adaptation of the classic interactive fiction game **ZORK III: The Dungeon Master**.

## About
This project reimagines the classic text adventure interface as a modern messaging app. It runs entirely in the browser using the **JSZM** interpreter to execute the original Z-machine story file.

Developed with a focus on responsiveness, accessibility, and a premium mobile experience.

## Features
- **Modern UI**: Chat-bubble interface with responsive design.
- **Mobile Optimized**: Full-screen experience, safe-area handling, and virtual keyboard support.
- **Text-to-Speech**: Integrated Web Speech API to read game output aloud with a retro "beep" indicator.
- **Auto-Save**: Seamless save/load functionality using LocalStorage.
- **Real-time Clock**: Status bar synced to your device time.

## Technology
- **Engine**: [JSZM](https://www.ifwiki.org/JSZM) (JavaScript Z-Machine Interpreter)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Audio**: Web Audio API (procedural sound generation) & Web Speech API

## Source Code
Zork III: The Dungeon Master is a 1982 interactive fiction game written by Marc Blank, Dave Lebling, Bruce Daniels, and Tim Anderson and published by Infocom.

Further information on Zork III:

* [Wikipedia](https://en.wikipedia.org/wiki/Zork_III)
* [The Digital Antiquarian](https://www.filfre.net/2012/09/zork-iii-part-1/)
* [The Interactive Fiction Database](https://ifdb.tads.org/viewgame?id=vrsot1zgy1wfcdru)
* [The Infocom Gallery](https://gallery.guetech.org/zork3/zork3.html)
* [IFWiki](http://www.ifwiki.org/index.php/Zork_III)

The ZIL source code in this repository is a directory of files for the Infocom game "Zork III", including a variety of files both used and discarded in the production of the game. It is written in ZIL (Zork Implementation Language), a refactoring of MDL (Muddle), itself a dialect of LISP created by MIT students and staff.

## Credits & License
**Developer**: Lewis Dryburgh

**Disclaimer**:
This is an **unofficial fan project**. It is not affiliated with, endorsed by, or connected to Infocom, Activision, or any other trademark holders of the Zork franchise.

**Source Code**:
The Z-Machine interpreter source code is provided under the **MIT License (Microsoft, 2025)** (see `LICENSE-ZORK`).
The frontend web wrapper and UI code is provided under the **MIT License (Lewis Dryburgh, 2026)** (see `LICENSE-FRONTEND`).

*ZORK is a registered trademark of Infocom, Inc.*
*Original Game © 1982-1986 Infocom, Inc.*

