💌 Renovación de Noviazgo — para Caramelo
A whimsical, vintage love-letter website where Mike asks Alondra ("Caramelo") to renew their noviazgo. She gets a Yes / No button — but the No button runs away from the cursor and refuses to be clicked. Once she says Yes, confetti flies, a wax seal stamps down, and she "signs" an official (and very binding) love contract.
Built as a one-page gift to celebrate becoming novios on November 9, 2025.

✨ Features

The renewal question with Yes / No buttons.
The "No" trap — on a laptop the No button physically dodges the cursor and can never be clicked. Each dodge grows the Yes button and cycles a new playful message ("Are you sure? 🥺", "Solo hay una respuesta correcta 💕", etc.).
Celebration on Yes — confetti burst + animated wax-seal stamp.
Fake love contract — an official-looking vintage document with editable clauses.
Signature canvas — she draws her signature with the mouse, then "signs" to finalize.
Photo spots — vintage polaroid frames with placeholders, ready for your own pictures.
$10k-look animations — scroll-triggered reveals, hero parallax, staggered fade-ins, floating hearts, and wax-seal effects.


📁 Project Structure
renovacion-caramelo/
├── index.html        # Page structure and content
├── styles.css        # Vintage parchment styling + animations
├── script.js         # Dodging button, confetti, signing logic
├── photos/           # Drop your photos here
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── photo3.jpg
└── README.md         # This file

▶️ How to Run
No build step, no install. Just double-click index.html to open it in any browser (Chrome, Safari, Firefox, Edge).

💡 Best viewed on a laptop/desktop, since the dodging "No" button follows the cursor.

If a browser blocks the CDN animation libraries when opening directly, run a quick local server instead:
bash# from inside the project folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser

🎨 How to Customize
Everything you'll want to change is commented in the code.
The contract clauses
Open index.html and look for the <!-- CONTRACT CLAUSES --> section. Edit the text of each clause freely. Default clauses:

Caramelo agrees to renew her noviazgo with Mike for at least one more year.
Minimum two besos daily — no refunds.
Stealing the cobijas at 3am stays 100% permitted.
All arguments must end in cuddles, por orden oficial.
Mike provides unlimited snacks, hugs, and bad jokes.
Binding, irrevocable, y firmado con amor. 💍

Names & date
Search index.html for the <!-- NAMES --> and <!-- DATE --> comments to update the headline, signatures, or anniversary date.
The funny "No" messages
Open script.js and edit the messages array near the top to add your own inside jokes.
Photos
Drop your images into the photos/ folder using the same file names (photo1.jpg, photo2.jpg, photo3.jpg), or update the src paths in index.html.

🛠️ Tech

Vanilla HTML / CSS / JavaScript — no frameworks, no build step
GSAP + ScrollTrigger (via CDN) for scroll animations and parallax
canvas-confetti (via CDN) for the celebration effects
Google Fonts — Playfair Display, EB Garamond, Dancing Script


❤️ Note
Made with love for Caramelo. Te amo. — Mike
