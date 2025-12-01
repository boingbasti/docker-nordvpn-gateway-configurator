function toggleFields() {
    const mode = document.getElementById('networkMode').value;
    const wgBypass = document.getElementById('wgBypass').checked;
    const tech = document.getElementById('vpnTech').value;
    
    // Show/Hide Macvlan
    document.getElementById('macvlanSettings').style.display = (mode === 'advanced') ? 'block' : 'none';
    document.getElementById('routingCard').style.display = (mode === 'advanced') ? 'block' : 'none';
    
    // Show/Hide WireGuard Settings
    document.getElementById('wgSettings').style.display = wgBypass ? 'block' : 'none';
    
    // Show/Hide WG Hooks Panel (Right side)
    document.getElementById('wgHooksCard').style.display = (mode === 'advanced' && wgBypass) ? 'block' : 'none';

    // Sync WG Service Checkbox logic
    if(wgBypass) {
        document.getElementById('addWgEasy').checked = true;
        document.getElementById('addWgEasyWrapper').style.display = 'block';
    }
    
    // OpenVPN Protocol Toggle
    document.getElementById('protoDiv').style.display = (tech === 'OpenVPN') ? 'block' : 'none';

    // Specific Server Override
    const serverSpecified = document.getElementById('vpnServer').value.trim() !== "";
    document.getElementById('vpnCountry').disabled = serverSpecified;
    document.getElementById('vpnGroup').disabled = serverSpecified;

    // Smart Server Selection dependency
    const autoConnect = document.getElementById('autoConnect').checked;
    document.getElementById('divBestServerInterval').style.visibility = autoConnect ? 'visible' : 'hidden';

    // Performance Self-Healing dependency
    const speedInterval = document.getElementById('speedInterval').value;
    const showSpeedSettings = (speedInterval > 0) ? 'visible' : 'hidden';
    document.getElementById('divMinSpeed').style.visibility = showSpeedSettings;
    document.getElementById('divSpeedSize').style.visibility = showSpeedSettings;

    // Hide WG Easy option in simple mode
    if(mode === 'simple') {
        document.getElementById('addWgEasyWrapper').style.display = 'none';
        document.getElementById('addWgEasy').checked = false;
    } else {
        document.getElementById('addWgEasyWrapper').style.display = 'block';
    }
    
    // SOCKS5 Settings visibility
    const addSocks = document.getElementById('addSocks').checked;
    document.getElementById('socksSettings').style.display = addSocks ? 'block' : 'none';
    
    // Token Warning Logic
    const token = document.getElementById('vpnToken').value;
    const embedToken = document.getElementById('embedToken').checked;
    const warning = document.getElementById('tokenWarning');
    if (embedToken && !token) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }

    generateYAML();
    generateHooks();
}

function syncWgToggle() {
    const wgService = document.getElementById('addWgEasy').checked;
    if(wgService) {
        document.getElementById('wgBypass').checked = true;
        document.getElementById('wgSettings').style.display = 'block';
    }
    toggleFields();
}

function generateHooks() {
    // 1. Hole notwendige Variablen
    const gwIp = document.getElementById('gatewayIp').value || '192.168.1.100';
    const wgSubnet = document.getElementById('wgSubnet').value || '10.8.0.0/24';
    
    // Hole das erste LAN-Subnetz aus der Allowlist für die Masquerading-Regel (V1)
    const allowlistVal = document.getElementById('allowlist').value;
    const lanSubnet = allowlistVal.split(',')[0].trim() || '192.168.1.0/24';

    // Berechne Router IP für V2 PostDown Fallback
    const parts = gwIp.split('.');
    let routerIp = '192.168.1.1';
    if(parts.length === 4) {
        parts[3] = '1';
        routerIp = parts.join('.');
    }

    // --- VARIANT 1: LAN Access (Recommended) ---
    // Nutzt Split-Routing (0.0.0.0/1) und Masquerading für LAN-Ziele
    const v1_Up = `ip route add 0.0.0.0/1 via ${gwIp}; ip route add 128.0.0.0/1 via ${gwIp}; iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -s ${wgSubnet} -d ${lanSubnet} -o eth0 -j MASQUERADE`;
    
    const v1_Down = `ip route del 0.0.0.0/1; ip route del 128.0.0.0/1; iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -s ${wgSubnet} -d ${lanSubnet} -o eth0 -j MASQUERADE`;


    // --- VARIANT 2: Internet Only (Strict) ---
    // Löscht default route. Kein LAN Zugriff möglich.
    const v2_Up = `ip route del default; ip route add default via ${gwIp}; iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE`;
    
    const v2_Down = `ip route del default; ip route add default via ${routerIp}; iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE`;


    // 3. Update UI
    document.getElementById('hookPostUpV1').value = v1_Up;
    document.getElementById('hookPostDownV1').value = v1_Down;
    
    document.getElementById('hookPostUpV2').value = v2_Up;
    document.getElementById('hookPostDownV2').value = v2_Down;

    document.getElementById('routerIpDisplay').innerText = routerIp;
}

function generateYAML() {
    // 1. Read all inputs
    const mode = document.getElementById('networkMode').value;
    const gwIp = document.getElementById('gatewayIp').value || '192.168.1.100';
    let netName = document.getElementById('extNetName').value || 'macvlan';
    netName = netName.trim(); 
    
    const token = document.getElementById('vpnToken').value;
    const embedToken = document.getElementById('embedToken').checked;

    const country = document.getElementById('vpnCountry').value || 'Germany';
    const group = document.getElementById('vpnGroup').value;
    const server = document.getElementById('vpnServer').value;
    const tech = document.getElementById('vpnTech').value;
    const proto = document.getElementById('vpnProtocol').value;
    
    const autoConnect = document.getElementById('autoConnect').checked;
    const killswitch = document.getElementById('killswitch').checked;
    const tpl = document.getElementById('tpl').checked;
    const pq = document.getElementById('postQuantum').checked;
    
    const speedInterval = document.getElementById('speedInterval').value;
    const minSpeed = document.getElementById('minSpeed').value;
    const speedSize = document.getElementById('speedTestSize').value;
    
    const bestServerInterval = document.getElementById('bestServerInterval').value;
    const vpnRefresh = document.getElementById('vpnRefresh').value;
    const checkInterval = document.getElementById('checkInterval').value;
    const connectTimeout = document.getElementById('connectTimeout').value;
    const logStatus = document.getElementById('logStatus').value;
    const mtu = document.getElementById('vpnMtu').value;
    const retryCount = document.getElementById('retryCount').value;
    const retryDelay = document.getElementById('retryDelay').value;
    
    const addHealthchecks = document.getElementById('addHealthchecks').checked;
    const debug = document.getElementById('debugMode').checked;
    const showHooks = document.getElementById('showHooks').checked;

    const subnets = document.getElementById('allowlist').value;
    const wgBypass = document.getElementById('wgBypass').checked;
    const wgIp = document.getElementById('wgIp').value;
    const wgSubnet = document.getElementById('wgSubnet').value;

    const addSocks = document.getElementById('addSocks').checked;
    const socksIps = document.getElementById('socksAllowed').value;
    
    const addPrivoxy = document.getElementById('addPrivoxy').checked;
    const addAdguard = document.getElementById('addAdguard').checked;
    const addWgEasy = document.getElementById('addWgEasy').checked;


    // 2. Build YAML
    let yaml = `version: "3.9"\n\nservices:\n`;

    // --- VPN SERVICE ---
    yaml += `  vpn:\n`;
    yaml += `    image: boingbasti/nordvpn-gateway:latest\n`;
    yaml += `    container_name: nordvpn\n`;
    
    if (mode === 'advanced') {
        yaml += `    networks:\n      ${netName}:\n        ipv4_address: ${gwIp}\n`;
        yaml += `    stop_grace_period: 45s\n`;
    }

    yaml += `    cap_add:\n      - NET_ADMIN\n`;
    if (autoConnect) yaml += `      - NET_RAW\n`;
    
    yaml += `    devices:\n      - /dev/net/tun\n`;
    
    if (embedToken && token) {
         yaml += `    volumes:\n      - /etc/localtime:/etc/localtime:ro\n`;
    } else {
         yaml += `    volumes:\n      - ./nordvpn_token.txt:/run/secrets/nordvpn_token:ro\n      - /etc/localtime:/etc/localtime:ro\n`;
    }

    yaml += `    environment:\n`;
    
    if (embedToken && token) yaml += `      - NORDVPN_TOKEN=${token}\n`;

    if (server) {
        yaml += `      - VPN_SERVER=${server}\n`;
    } else {
        yaml += `      - VPN_COUNTRY=${country}\n`;
        if (group !== 'p2p') yaml += `      - VPN_GROUP=${group}\n`;
    }
    
    yaml += `      - VPN_TECHNOLOGY=${tech}\n`;
    if (tech === 'OpenVPN') yaml += `      - PROTOCOL=${proto}\n`;
    
    if (autoConnect) {
        yaml += `      - VPN_AUTO_CONNECT=best\n`;
        if (bestServerInterval != 30) yaml += `      - VPN_BEST_SERVER_CHECK_INTERVAL=${bestServerInterval}\n`;
    }
    
    if (killswitch) yaml += `      - KILLSWITCH=on\n`; else yaml += `      - KILLSWITCH=off\n`;
    if (tpl) yaml += `      - THREAT_PROTECTION_LITE=on\n`;
    if (!pq) yaml += `      - POST_QUANTUM=off\n`; 
    
    yaml += `      - VPN_MTU=${mtu}\n`;
    
    if (speedInterval > 0) {
        yaml += `      # Performance Self-Healing\n`;
        yaml += `      - VPN_SPEED_CHECK_INTERVAL=${speedInterval}\n`;
        yaml += `      - VPN_MIN_SPEED=${minSpeed}\n`;
        
        // --- NEW: Add File Size Config if Large ---
        if (speedSize === '100') {
             yaml += `      - SPEED_TEST_URL=http://cachefly.cachefly.net/100mb.test\n`;
        }
    }
    
    if (vpnRefresh > 0) yaml += `      - VPN_REFRESH=${vpnRefresh}\n`;
    if (checkInterval != 60) yaml += `      - CHECK_INTERVAL=${checkInterval}\n`;
    if (connectTimeout != 60) yaml += `      - CONNECT_TIMEOUT=${connectTimeout}\n`;
    if (logStatus > 0) yaml += `      - LOG_STATUS_INTERVAL=${logStatus}\n`;
    if (retryCount != 2) yaml += `      - RETRY_COUNT=${retryCount}\n`;
    if (retryDelay != 2) yaml += `      - RETRY_DELAY=${retryDelay}\n`;
    
    if (debug) yaml += `      - DEBUG=on\n`;
    if (showHooks) yaml += `      - SHOW_WGHOOKS=on\n`;

    if (mode === 'advanced') {
        yaml += `\n      # Routing & Bypass\n`;
        yaml += `      - ALLOWLIST_SUBNET=${subnets}\n`;
        if (wgBypass) {
            yaml += `      - WIREGUARD_BYPASS=on\n`;
            yaml += `      - WIREGUARD_SERVER_IP=${wgIp}\n`;
            yaml += `      - WIREGUARD_SUBNET=${wgSubnet}\n`;
        }
    }
    
    if (mode === 'advanced') {
        yaml += `    sysctls:\n      - net.ipv4.ip_forward=1\n`;
        yaml += `      - net.ipv6.conf.all.disable_ipv6=1\n`;
    }
    
    yaml += `    restart: unless-stopped\n\n`;

    // --- WG-EASY ---
    if (mode === 'advanced' && addWgEasy) {
        yaml += `  # WireGuard Server (UI: http://${wgIp}:51821)\n`;
        yaml += `  wg-easy:\n    image: ghcr.io/wg-easy/wg-easy:15\n    container_name: wg-easy\n    networks:\n      ${netName}:\n        ipv4_address: ${wgIp}\n    depends_on: [vpn]\n    cap_add: [NET_ADMIN, SYS_MODULE]\n    volumes:\n      - ./wg-easy-data:/etc/wireguard\n      - /lib/modules:/lib/modules:ro\n    environment:\n      - INSECURE=true\n      - DISABLE_IPV6=true\n    sysctls:\n      - net.ipv6.conf.all.disable_ipv6=1\n`;
        
        if (addHealthchecks) {
            yaml += `    healthcheck:\n      test: ["CMD", "ping", "-c", "1", "-W", "5", "1.1.1.1"]\n      interval: 60s\n      timeout: 10s\n      retries: 3\n      start_period: 2m\n`;
        }
        
        yaml += `    restart: unless-stopped\n\n`;
    }

    // --- SOCKS5 ---
    if (addSocks) {
        yaml += `  # SOCKS5 Proxy -> Access at ${gwIp}:1080\n`;
        yaml += `  socks5:\n    image: boingbasti/nordvpn-socks5:latest\n    container_name: nordvpn-socks5\n`;
        if (mode === 'advanced') yaml += `    depends_on: [vpn]\n    network_mode: "service:vpn"\n`;
        else yaml += `    network_mode: "service:vpn"\n    depends_on: [vpn]\n`;
        
        yaml += `    environment:\n      - PROXY_PORT=1080\n      - ALLOWED_IPS=${socksIps}\n`;
        
        if (addHealthchecks) {
            yaml += `    healthcheck:\n      test: ["CMD", "curl", "-fsSL", "--max-time", "5", "-x", "socks5h://localhost:1080", "https://1.1.1.1"]\n      interval: 60s\n      timeout: 10s\n      retries: 3\n      start_period: 1m\n`;
        }
        
        yaml += `    restart: unless-stopped\n\n`;
    }

    // --- PRIVOXY ---
    if (addPrivoxy) {
        yaml += `  # HTTP Proxy -> Access at ${gwIp}:8118\n`;
        yaml += `  http-proxy:\n    image: boingbasti/nordvpn-privoxy:latest\n    container_name: nordvpn-privoxy\n    network_mode: "service:vpn"\n    depends_on: [vpn]\n`;
        
        if (addHealthchecks) {
            yaml += `    healthcheck:\n      test: ["CMD", "curl", "-fsSL", "--max-time", "5", "-x", "http://localhost:8118", "https://1.1.1.1"]\n      interval: 60s\n      timeout: 10s\n      retries: 3\n      start_period: 1m\n`;
        }
        
        yaml += `    restart: unless-stopped\n\n`;
    }

    // --- ADGUARD ---
    if (addAdguard) {
        yaml += `  # AdGuard Home -> Access UI at http://${gwIp}:80 (or 3000 for setup)\n`;
        yaml += `  adguardhome:\n    image: adguard/adguardhome:latest\n    container_name: nordvpn-adguard\n    network_mode: "service:vpn"\n    depends_on: [vpn]\n    volumes:\n      - ./adguard-work:/opt/adguardhome/work\n      - ./adguard-config:/opt/adguardhome/conf\n    cap_add: [NET_ADMIN]\n`;
        
        if (addHealthchecks) {
            yaml += `    healthcheck:\n      test: ["CMD", "nslookup", "google.com", "1.1.1.1"]\n      interval: 60s\n      timeout: 10s\n      retries: 3\n      start_period: 2m\n`;
        }
        
        yaml += `    restart: unless-stopped\n\n`;
    }

    // --- NETWORKS ---
    if (mode === 'advanced') {
        yaml += `networks:\n  ${netName}:\n    external: true\n`;
    }

    document.getElementById('yamlOutput').value = yaml;
}

function copyCode() {
    const copyText = document.getElementById("yamlOutput");
    copyText.select();
    document.execCommand("copy");
    alert("YAML copied to clipboard!");
}

function copyHook(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    document.execCommand("copy");
    alert("Hook command copied!");
}

function downloadCode() {
    const text = document.getElementById("yamlOutput").value;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', "docker-compose.yml");
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Init
document.getElementById('configForm').addEventListener('input', () => {
    generateYAML();
    generateHooks();
});
toggleFields();