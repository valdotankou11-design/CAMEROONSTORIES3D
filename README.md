# 🇨🇲 CAMEROON STORIES 3D · YAOUNDÉ

<p align="center">
  <img src="https://img.shields.io/badge/Engine-Three.js_r128-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Language-Vanilla_JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Graphics-WebGL_3D-990000?style=for-the-badge&logo=webgl&logoColor=white" alt="WebGL" />
  <img src="https://img.shields.io/badge/Platform-Desktop_%7C_Mobile_%7C_PWA-10B981?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License MIT" />
</p>

<p align="center">
  <strong>An ambitious, browser-based 3D open-world action-adventure game set in the vibrant streets of Yaoundé, Cameroon.</strong><br>
  <em>Carjacking, yellow taxis, street soya stands, Makossa radio, police chases, enterable venues, and 15 story-driven chapters — running entirely in native WebGL with zero build steps!</em>
</p>

---

## 🌟 Overview

**Cameroon Stories 3D** is a GTA-inspired open-world game built from the ground up using **Vanilla JavaScript** and **Three.js**. Roam through a massive 14×14 block replica of Yaoundé, take on contracts from local bosses, cruise in iconic yellow taxis, dodge the police, and immerse yourself in an authentic urban Cameroonian atmosphere.

Whether you are dodging roadblocks around the **Monument de la Réunification**, grabbing hot soya skewers at the street market, or vibing to Makossa and Bikutsi on the car radio, *Cameroon Stories 3D* brings a unique cultural flavor to 3D web gaming.

---

## 🎮 Key Features

### 🏙️ Living, Breathing Open-World Yaoundé
- **14×14 Grid Urban Map**: Explore iconic districts including **Bastos (VIP Residencies)**, **Mvog-Mbi**, **Ngoa-Ekellé (Campus/University)**, **Centre-Ville (Boulevard)**, **Lac Municipal**, the **Medical Quarter**, **Nightlife & Mall Zone**, and the **Industrial Sector**.
- **Interactive Venues**: Walk seamlessly into interiors with no loading screens — the Player Villa/Safehouse, Gym (stamina training), Restaurants/Maquis, Fashion Boutiques, and the Armory.
- **Street Economy & Life**: Buy hot soya skewers, fresh juices, and ice cream from street vendors to replenish health and armor.
- **Living Citizens (NPCs)**: Articulated 3D inhabitants with routines, Cameroonian skin tones, professional roles (doctors, nurses, bouncers, merchants), and contextual dialogue.

### 🚗 Realistic Driving & Traffic AI
- **Iconic Vehicles**: Drive famous Cameroonian **Yellow Taxis**, private sedans, and police cruisers.
- **Physical Details**: 360° transparent & breakable glass windows, steerable front wheels, functioning headlights, brake lights, and reverse lights.
- **True Carjacking**: Pull drivers out of their vehicles with animated character reactions.
- **Urban Flow**: 22-second traffic light cycles, civilian traffic, and car horn system (`H`).

### 🔫 Arsenal & Tactical Combat
- **Full Weapon Wheel**:
  - 👊 **Mains Nues (Fists)**: Fast melee combat with punch combos.
  - 🔫 **Pistolet 9mm**: High accuracy, infinite reserve ammunition.
  - ⚡ **Mitraillette Uzi (SMG)**: Rapid fire for close-quarters drive-bys.
  - 💥 **Fusil à Pompe (Shotgun)**: Devastating multi-pellet spread.
  - 🎯 **Fusil AK-47 (Assault Rifle)**: Long-range urban warfare staple.
  - 🔭 **Fusil Sniper M24**: High-velocity zoom with custom sniper crosshairs.
- **Raycast Ballistics**: Dynamic recoil, bullet spread, muzzle flashes, window shattering, and character hit reactions.

### 👮 Wanted System & Law Enforcement
- **5-Star Wanted Level**: Escalate from simple patrol curiosity to full tactical deployment.
- **Adaptive Police AI**: High-speed patrol chases, strategic street roadblocks, spike strips, and police helicopter air support at higher alert levels.

### 📻 Procedural Web Audio & Authentic Radios
- **Procedural Sound Engine**: Synthesized engine revs scaling with speed, realistic sirens, gunshots, impacts, and glass breaks powered by the native Web Audio API.
- **Cameroonian Radio Stations**:
  1. 🎶 **CRTV FM · Makossa**
  2. 🪘 **Yaoundé Hit · Bikutsi**
  3. 🎧 **Douala Vibe · Afrobeats**
  4. 🔇 **Radio Off**

### 📱 Responsive Dual-Controls
- **Desktop**: Tight Keyboard + Mouse aim with persistent camera zoom.
- **Mobile & Tablet**: Automatic touch detection with on-screen dual virtual joysticks, action buttons, weapon selectors, and camera swipe.

### 🛡️ Rock-Solid Engine & Safety Net (`safety.js`)
- **Zero-Crash Architecture**: Physics sub-stepping prevents clipping through walls during frame drops.
- **Infinite Safety Floor**: Fall protection automatically salvages player position.
- **Dynamic Chunk Streaming**: Blocks around the player load immediately without phantom walls.
- **Auto-Save**: Seamless `localStorage` persistence saves your cash, mission progression, weapons, and stats.

---

## 🎬 Storyline & Missions

The game features **15 cinematic chapters** with custom briefings, dialogues, rewards, and objectives:

| Chapter | Title | Contact / Speaker | Location | Reward |
|:---|:---|:---|:---|:---:|
| **Ch. 1** | *Le Contrat du Monument* | Le Patron (Caïd du Boulevard) | Monument de la Réunification | **500 FCFA** |
| **Ch. 2** | *Livraison Sous Surveillance* | Karim (Chef de Gang Mvog-Mbi) | Mvog-Mbi ➔ Ngoa-Ekellé | **750 FCFA** |
| **Ch. 3** | *Embûche au Carrefour* | Commandant Mbarga (Informateur) | Carrefour Central | **1,100 FCFA** |
| **Ch. 4** | *Course VIP à Bastos* | Madame Chantal (Femme d’Affaires) | Quartier Bastos | **1,300 FCFA** |
| **Ch. 5** | *Alerte Rouge* | L’Ombre (Stratège) | Station-Service | **1,650 FCFA** |
| **Ch. 6** | *Règlement de Comptes au Lac* | Karim | Lac Municipal | **2,000 FCFA** |
| **Ch. 7** | *Traversée Nocturne* | Le Patron | Mvog-Mbi Est | **2,400 FCFA** |
| **Ch. 8** | *Le Braquage de Yaoundé* | Le Patron | Centre-Ville (3 Étoiles) | **3,500 FCFA** |
| **Ch. 9** | *Marchandise Sensible* | Madame Chantal | Grand Marché | **2,200 FCFA** |
| **Ch. 10–14** | *Syndicats, Marché Noir & Exfiltration* | Contacts Clandestins | Yaoundé Métropole | **Variable** |
| **Ch. 15** | *Mode Libre (Endgame)* | Exploration Libre & Gigs | Toute la Ville | **Illimité** |

### 🎯 Side Activities
- 🏁 **Courses de Rue**: Illegal street sprints across city avenues.
- 📦 **Livraison Express**: High-speed package courier runs against the clock.
- 🚖 **Missions Taxi**: Pick up passengers and navigate through Yaoundé traffic.
- 🎯 **Chasse aux Primes**: Neutralize high-value targets for hefty underworld bounties.

---

## 🕹️ Controls Guide

### 💻 Desktop Controls

| Action | Primary Key | Secondary Key |
|:---|:---:|:---:|
| **Move / Steer** | `W` `A` `S` `D` | Arrow Keys (`↑` `←` `↓` `→`) |
| **Sprint / Nitro** | `Shift` (Hold) | Double tap directional |
| **Jump** | `C` | — |
| **Interact / Enter Vehicle / Dialogues** | `E` | `Enter` |
| **Aim** | Right Click (`Mouse 2`) | Toggle Aim Button |
| **Attack / Shoot / Punch** | Left Click (`Mouse 1`) | — |
| **Reload Weapon** | `R` | — |
| **Switch Weapon** | `Tab` or `Q` | Number Keys `1`–`6` |
| **Car Horn** | `H` | — |
| **Cycle Radio Station** | `T` | — |
| **Toggle Yaoundé Map** | `M` | Click Radar HUD |
| **Pause Menu** | `Esc` | `P` |

### 📱 Touch Controls (Mobile & Tablets)
- **Left Virtual Joystick**: Move character or steer vehicle.
- **Right Area / Touchpad**: Swipe to rotate 3D camera.
- **Action Buttons**: Dedicated touch icons for Fire (🎯), Aim (🔍), Sprint (⚡), Interact/Carjack (🚪), Jump (🦘), and Horn (📢).
- **HUD Shortcuts**: Tap the Mini-Radar to expand the full city map; tap the weapon icon to open the quick-select weapon wheel.

---

## 🚀 Quick Start & Installation

Because **Cameroon Stories 3D** is crafted in pure client-side JavaScript, it requires **no npm, no Webpack, no node_modules, and no build pipeline**.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/cameroon-stories-3d.git
cd cameroon-stories-3d
```

### 2. Run Locally
You can run the game with any static file server:

**Using Python 3:**
```bash
python3 -m http.server 8080
```

**Using Node.js (`npx serve`):**
```bash
npx serve .
```

**Using VS Code:**
Simply right-click `index.html` and choose **"Open with Live Server"**.

Open your browser and navigate to:
```
http://localhost:8080
```

### 3. Deploy to GitHub Pages (One Click)
1. Push your code to GitHub.
2. In your repository, go to **Settings** > **Pages**.
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
4. Click **Save**. Your game is instantly playable online at `https://your-username.github.io/cameroon-stories-3d/`!

---

## 📂 Project Architecture

```
CAMEROONSTORIES3D/
├── index.html        # Main HTML shell, HUD overlay, crosshair & canvas mounts
├── style.css         # Cyber-urban styling, cinematic letterboxes, responsive UI
├── game.js           # Core loop, input handling, missions, radio, save system
├── world.js          # 3D world geometry, procedural buildings, vehicle meshes
├── extras_world.js   # Street lamps, billboards, foliage, traffic lights
├── districts.js      # City zones (Bastos, Mvog-Mbi, Campus, Medical, etc.)
├── venues.js         # Enterable interior venues (Villa, Gym, Restaurant, Armory)
├── actions.js        # Character biomechanics, climbing, sitting, animations
├── actors.js         # Living NPC routines, dialogue scripts, civilian AI
├── weapons.js        # Arsenal catalogue, zoom logic, recoil & sniper scope
├── decor.js          # Urban props, market stalls, soya stands, ambient decor
├── safety.js         # Fall protection, WebGL recovery, physics anti-clipping
└── LICENSE           # MIT Open Source License
```

---

## 🛠️ Tech Stack & Highlights

- **3D Graphics Engine**: [Three.js (r128)](https://threejs.org/) via CDN.
- **Audio Synthesis**: Native HTML5 Web Audio API (procedural tones, sirens, engine sounds).
- **Physics & Collisions**: Custom sub-stepped AABB raycast and vehicle physics with zero third-party dependencies.
- **Data Persistence**: HTML5 `localStorage` preserving game progress.
- **Zero Dependencies**: Pure HTML5, CSS3, and JavaScript ES6+.

---

## 🤝 Contributing

Contributions, bug reports, and cultural feature ideas are warmly welcome!
1. Fork the Project (`gh repo fork`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<p align="center">
  Crafted with ❤️ for Cameroonian and African game development.<br>
  <strong>Fièrement propulsé par les talents du 237 🇨🇲</strong>
</p>
