// app.js

const messageArea = document.getElementById('message-area');
const inputForm = document.getElementById('input-form');
const commandInput = document.getElementById('command-input');
const statusTime = document.querySelector('.status-bar .time');
const statusName = document.querySelector('.header-actions'); // Using for score/moves maybe?
const scrollFab = document.getElementById('scroll-fab');

// Update Clock
function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    if (statusTime) statusTime.textContent = formattedTime;
}
setInterval(updateClock, 1000); // Update every second
updateClock();

let jszm = null;
let runner = null;
let textBuffer = "";
let isWaitingForInput = false;
let justSaved = false;

// Basic mobile detection
function isMobileDevice() {
    return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.innerWidth <= 800)
    );
}

// Helper to scroll to bottom
function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
    updateScrollFab();
}

// Show/hide scroll FAB based on scroll position
function updateScrollFab() {
    if (!scrollFab) return;
    const threshold = 100; // pixels from bottom
    const isNearBottom = messageArea.scrollHeight - messageArea.scrollTop - messageArea.clientHeight < threshold;
    scrollFab.classList.toggle('hidden', isNearBottom);
}

// Listen for scroll to show/hide FAB
messageArea.addEventListener('scroll', updateScrollFab);

// FAB click scrolls to bottom
if (scrollFab) {
    scrollFab.addEventListener('click', () => {
        messageArea.scrollTo({ top: messageArea.scrollHeight, behavior: 'smooth' });
    });
}

// Helper to add a message to the UI
function addMessage(text, type = 'received') {
    if (!text.trim()) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble';
    bubbleDiv.textContent = text;

    messageDiv.appendChild(bubbleDiv);
    messageArea.appendChild(messageDiv);
    scrollToBottom();
}

// Flush the accumulated text buffer to the UI
function flushBuffer() {
    if (textBuffer) {
        // Clean up common Z-machine artifacts like the prompt character
        let text = textBuffer;

        // Remove trailing prompt ">" and any preceding newline
        text = text.replace(/\n?>\s*$/, '');

        textBuffer = "";

        // Check if we should suppress the "Ok." confirmation from Z-Machine after a save
        if (justSaved) {
            justSaved = false;
            // The machine typically prints "Ok." or "Ok.\n"
            if (text.trim() === "Ok.") {
                return; // Suppress output
            }
        }

        if (text.trim()) {
            // Check if this is the initial copyright block
            // It usually ends with "Serial number XXXXXX" followed by newlines and the first room
            const serialRegex = /(Serial number \d{6})(?:\s*\n)+/;
            const match = text.match(serialRegex);

            if (match) {
                // Split into two parts
                const splitIndex = match.index + match[0].length;
                const part1 = text.substring(0, splitIndex).trim();
                const part2 = text.substring(splitIndex).trim();

                // Inject custom messages instead of the original copyright text (part1)
                addMessage("ZORK III: The Dungeon Master\nOriginal game © 1982-1986 Infocom, Inc. All rights reserved.\nZORK is a registered trademark of Infocom, Inc.", 'received');
                addMessage("Source code used under MIT License (Microsoft, 2025).\nUnofficial fan project. Not affiliated with or endorsed by trademark holders.", 'received');

                if (part2) addMessage(part2, 'received');
            } else {
                // Normal message
                addMessage(text, 'received');
            }
        }
    }
}

// Main Runner Loop
function runMachine(resumeValue) {
    if (!runner) return;

    try {
        let result = runner.next(resumeValue);

        // Loop until we hit a yield that asks for input or done
        while (!result.done) {
            if (result.value && result.value.type === 'waitForInput') {
                // The machine is waiting for input
                isWaitingForInput = true;
                flushBuffer(); // Show what we have so far
                return; // Exit loop, wait for DOM event
            }

            // If it yielded something else (like null from print), just continue
            result = runner.next();
        }

        if (result.done) {
            flushBuffer();
            addMessage("--- GAME OVER ---", 'received');
        }

    } catch (e) {
        console.error("Z-Machine Error:", e);
        addMessage("Error: " + e.message, 'received');
    }
}

// Handle Form Submit
inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const command = commandInput.value.trim();
    if (!command) return;

    // Haptic feedback if supported
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }

    // Add user message immediately
    addMessage(command, 'sent');
    commandInput.value = '';

    // Keep focus on desktop, but allow blur on mobile if needed?
    // Actually, user explicitly asked for cursor to stay in the field.
    commandInput.focus();

    // Check for Restart Confirmation
    if (isWaitingForRestart) {
        isWaitingForRestart = false;
        const normalized = command.toLowerCase();
        if (normalized === 'yes' || normalized === 'y') {
            addMessage("Restarting...", 'received');
            localStorage.removeItem('zork3-save');
            setTimeout(() => location.reload(), 1000);
        } else {
            addMessage("Game continuing...", 'received');
            // If the game was waiting for input, it still is.
        }
        return;
    }

    if (isWaitingForInput) {
        isWaitingForInput = false;
        // Resume the machine with the input + newline
        runMachine(command + "\n");
    } else {
        // Engine not ready or busy
        console.warn("Engine not ready for input");
    }
});

// Handle Save Button
document.getElementById('save-btn').addEventListener('click', () => {
    if (isWaitingForInput && !isWaitingForRestart) {
        addMessage("save", 'sent'); // Visually show action
        isWaitingForInput = false;
        runMachine("save\n");
    } else {
        addMessage("Wait for a command prompt to save.", 'received');
    }
});

let isWaitingForRestart = false;

// Handle Restart Button
document.getElementById('restart-btn').addEventListener('click', () => {
    isWaitingForRestart = true;
    addMessage("Start a new game? This will clear all progress and your save status. Say yes to begin again.", 'received');
});


// Helper to play a beep sound (Web Audio API)
function playBeep() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // "Phone hang up" style beep
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(698.46, audioCtx.currentTime); // 698.46Hz

    // Louder volume (0.3) and longer duration (500ms)
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// Handle Text-to-Speech (Phone Button)
document.getElementById('tts-btn').addEventListener('click', () => {
    // Find the latest received message bubble
    const messages = document.querySelectorAll('.message.received .bubble');
    if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1].textContent;

        // Cancel any currently speaking text to avoid overlap
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(lastMessage);

        // Play beep when done
        utterance.onend = () => {
            playBeep();
        };

        window.speechSynthesis.speak(utterance);
    }
});


// Initial Setup
const init = async () => {
    console.log("Initializing Zork III: Mobile...");

    try {
        const response = await fetch('COMPILED/zork3.z3');
        if (!response.ok) throw new Error("Failed to load zork3.z3");
        const buffer = await response.arrayBuffer();

        jszm = new JSZM(new Uint8Array(buffer));

        // Override JSZM methods

        // Print: Accumulate text
        jszm.print = function* (text) {
            // text comes in chunks, often just characters or words
            textBuffer += text;
        };

        // Read: Yield a special object to pause the runner
        jszm.read = function* (maxlen) {
            return yield { type: 'waitForInput', maxlen };
        };

        // Status Line: Update header with location and score/moves
        // .updateStatusLine(text, v18, v17)
        // v18/v17 depend on statusType (score/moves vs time)
        // Zork III is usually Score/Moves.
        jszm.updateStatusLine = function* (text, left, right) {
            // text is usually the location name
            // left/right are numbers (e.g. Score: 0 Moves: 0)

            const contactStatus = document.querySelector('.contact-info .status');

            let statusText = "";
            if (jszm.statusType) { // Time
                // format numbers like 9:14
                statusText = `${left}:${right < 10 ? '0' + right : right}`;
            } else { // Score/Moves
                statusText = `Score: ${left} / Moves: ${right}`;
            }
            if (contactStatus) contactStatus.textContent = statusText;
        };

        // Save: Store state to LocalStorage
        jszm.save = function* (data) {
            try {
                // specific hack for large binary data in localstorage
                const binary = String.fromCharCode.apply(null, data);
                const base64 = btoa(binary);
                localStorage.setItem('zork3-save', base64);

                // Show success message
                addMessage("💾 Game Saved Successfully", 'received');
                justSaved = true; // Suppress next "Ok." message
                return 1; // Return success to Z-Machine
            } catch (e) {
                console.error("Save failed", e);
                addMessage("❌ Save Failed: " + e.message, 'received');
                return 0; // Return failure
            }
        };

        // Restore: Load state from LocalStorage
        jszm.restore = function* () {
            try {
                const base64 = localStorage.getItem('zork3-save');
                if (!base64) return null;
                const binary = atob(base64);
                const data = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
                return data;
            } catch (e) {
                console.error("Restore failed", e);
                return null;
            }
        };

        // Start script
        runner = jszm.run();
        runMachine(); // Start it up!

    } catch (e) {
        addMessage("Failed to initialize game: " + e.message, 'received');
        console.error(e);
    }
};


// Handle Mobile Keyboard / Viewport Resizes
const phoneContainer = document.querySelector('.phone-container');

function handleViewportResize() {
    if (window.visualViewport) {
        const viewport = window.visualViewport;

        // Resize container to match visual viewport (excludes keyboard)
        phoneContainer.style.height = `${viewport.height}px`;

        // Keep container at top of visual viewport
        phoneContainer.style.top = `${viewport.offsetTop}px`;
    }

    // Prevent any body scroll that might have snuck in
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Scroll chat to bottom with multiple attempts for iOS timing
    requestAnimationFrame(() => {
        scrollToBottom();
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 300);
    });
}

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', () => {
        // Prevent visual viewport from scrolling (iOS does this sometimes)
        window.scrollTo(0, 0);
    });
} else {
    window.addEventListener('resize', handleViewportResize);
}

// Ensure input focus brings things into view
commandInput.addEventListener('focus', () => {
    // Multiple timeouts to catch different keyboard animation speeds
    setTimeout(handleViewportResize, 100);
    setTimeout(handleViewportResize, 300);
    setTimeout(handleViewportResize, 500);
});

// Also handle blur to restore full height
commandInput.addEventListener('blur', () => {
    setTimeout(() => {
        if (window.visualViewport) {
            phoneContainer.style.height = '100%';
            phoneContainer.style.top = '0';
        }
        scrollToBottom();
    }, 100);
});

// Initial Focus for Desktop
if (!isMobileDevice()) {
    commandInput.focus();
}

init();
