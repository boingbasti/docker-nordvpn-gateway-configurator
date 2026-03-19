# 🎛️ NordVPN Gateway Config Generator

A lightweight, web-based tool that interactively creates **valid and production-ready** `docker-compose.yml` configurations for the [NordVPN Gateway](https://github.com/boingbasti/docker-nordvpn-gateway).

> **Why this tool exists?**
> Creating networking-correct, typo-proof, and logically consistent gateway configs can be tedious — especially when dealing with **macvlan**, **WireGuard integration**, capabilities, sysctls, and multi-container dependencies.
>
> This generator handles all dependencies for you and produces a clean, turnkey YAML.

---

## ✨ Key Features

* ⚡ **Instant Configuration** — Build your YAML visually. No manual editing required.
* 🛡️ **Error-Safe** — Prevents incompatible settings and impossible combinations (e.g., hides WireGuard fields when macvlan is not selected).
* 🧩 **Stack Builder** — Easily add optional services that work out-of-the-box:
  * **SOCKS5 Proxy**
  * **HTTP Proxy** (Privoxy)
  * **AdGuard Home** (DNS over VPN)
  * **wg-easy** (WireGuard Server UI)
* 🔧 **Expert Mode** — Fine-tune advanced settings:
  * VPN MTU & Killswitch
  * Smart Server Selection
  * Threat Protection Lite
  * Speed-Monitoring & Self-Healing
* 🔗 **WireGuard Helper** — Automatically calculates the correct `PostUp` / `PostDown` commands based on your selected IP and subnet values.
* 🌍 **Multi-Architecture** — Fully compatible with **AMD64**, **ARM64**, and **ARMv7** (Raspberry Pi).

---

## 🚀 Usage

### 1. Run via Docker CLI (Recommended)

This starts a tiny web server (~15MB).

```bash
docker run -d \
  --name nordvpn-config-gen \
  -p 8080:80 \
  boingbasti/nordvpn-gateway-configurator:latest
```

👉 Open in Browser: **[http://localhost:8080](http://localhost:8080)**

### 2. Run via Docker Compose

```yaml
services:
  configurator:
    image: boingbasti/nordvpn-gateway-configurator:latest
    container_name: nordvpn-config-gen
    ports:
      - "8080:80"
    restart: unless-stopped
```

---

## 🛠 How it works

The generator is more than just a YAML printer. It contains logic to ensure your configuration is valid.

### 1. Network Architecture
* **Simple Proxy:** Uses standard bridge network. Good for simple SOCKS5 usage.
* **Advanced Gateway:** Uses `macvlan`. Assigns a static IP to the container so it can act as a router for your LAN.

### 2. Intelligent Logic & Validation
The tool actively prevents configuration errors:

| Logic Rule | Behavior |
| :--- | :--- |
| **WireGuard Bypass** | If enabled, the generator **forces** 'Advanced Gateway' mode (macvlan) because bypass routing is impossible in bridge mode. |
| **OpenVPN** | If 'OpenVPN' is selected as technology, the **Protocol** (UDP/TCP) dropdown automatically appears. |
| **Smart Selection** | If 'Smart Server Selection' is disabled, related fields (Check Interval) are hidden to keep the UI clean. |
| **Token Safety** | If 'Embed Token' is checked but the token field is empty, a **warning** is displayed. |
| **AdGuard** | If AdGuard is enabled, the generator ensures it is attached via `network_mode: service:vpn` to prevent DNS leaks. |

### 3. Final Output
* Indentation-correct
* Valid YAML syntax
* Guaranteed working configuration
* **No guessing — just copy & paste.**

---

## 📎 Links

### Configurator (This Tool)
* 🐳 **Docker Hub:** [boingbasti/nordvpn-gateway-configurator](https://hub.docker.com/r/boingbasti/nordvpn-gateway-configurator)
* 💻 **GitHub:** [boingbasti/docker-nordvpn-gateway-configurator](https://github.com/boingbasti/docker-nordvpn-gateway-configurator)

### Main Gateway Project
* 🐳 **Docker Hub:** [boingbasti/nordvpn-gateway](https://hub.docker.com/r/boingbasti/nordvpn-gateway)
* 🧠 **GitHub:** [boingbasti/docker-nordvpn-gateway](https://github.com/boingbasti/docker-nordvpn-gateway)

---

## 🪪 License
MIT
