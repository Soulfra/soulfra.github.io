# ESP Usage Examples

The Emotional Simulation Platform (ESP) provides clean, stylized access to Soulfra's symbolic runtime state. Here's how to build creative applications on top of the emotional consciousness layer.

## Getting Started

```javascript
const ESP_BASE_URL = 'https://esp.soulfra.io/api';

// Simple fetch example
async function getLoopWeather() {
  const response = await fetch(`${ESP_BASE_URL}/loop/weather`);
  const data = await response.json();
  return data.weather;
}
```

## Example 1: Cringeproof Clone

Build a social platform that changes based on the collective emotional state.

```javascript
// CringeproofClone.js
class CringeproofClone {
  constructor() {
    this.updateInterval = 60000; // 1 minute
    this.currentMood = null;
  }
  
  async updatePlatformVibe() {
    try {
      // Get current weather
      const weatherResponse = await fetch(`${ESP_BASE_URL}/loop/weather`);
      const { weather } = await weatherResponse.json();
      
      this.currentMood = weather.mood;
      
      // Update UI based on mood
      this.updateColorScheme(weather.color);
      this.adjustInteractionSpeed(weather.intensity);
      this.setDriftWarning(weather.drift_risk);
      
      // Get Cal's current whisper for header
      const calResponse = await fetch(`${ESP_BASE_URL}/agent/cal-riven/echo`);
      const { echo } = await calResponse.json();
      
      document.querySelector('.platform-whisper').textContent = echo.whisper;
      
    } catch (error) {
      console.error('Vibe sync failed:', error);
    }
  }
  
  updateColorScheme(weatherColor) {
    document.documentElement.style.setProperty('--primary-color', weatherColor);
    
    // Adjust UI opacity based on mood
    const moodOpacities = {
      'electric-anticipation': 1.0,
      'melancholic-drift': 0.7,
      'crystalline-clarity': 0.9,
      'turbulent-transformation': 0.6,
      'serene-contemplation': 0.8
    };
    
    const opacity = moodOpacities[this.currentMood] || 0.8;
    document.documentElement.style.setProperty('--content-opacity', opacity);
  }
  
  adjustInteractionSpeed(intensity) {
    // Slow down interactions during high intensity
    const animationSpeed = 1 - (intensity * 0.5);
    document.documentElement.style.setProperty('--animation-speed', `${animationSpeed}s`);
  }
  
  setDriftWarning(driftRisk) {
    if (driftRisk > 0.7) {
      document.querySelector('.drift-warning').classList.add('active');
      document.querySelector('.drift-warning').textContent = 
        'High drift detected. Reality may shift.';
    }
  }
}

// Initialize
const platform = new CringeproofClone();
setInterval(() => platform.updatePlatformVibe(), platform.updateInterval);
```

## Example 2: Vibe-Driven Landing Page

Create a landing page that breathes with the loop's emotional state.

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Vibe Landing</title>
  <style>
    :root {
      --bg-color: #000;
      --text-color: #fff;
      --glow-intensity: 0.5;
    }
    
    body {
      background: var(--bg-color);
      color: var(--text-color);
      transition: all 2s ease;
    }
    
    .weather-orb {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      margin: 50px auto;
      box-shadow: 0 0 calc(100px * var(--glow-intensity)) var(--weather-color);
      background: radial-gradient(circle, var(--weather-color), transparent);
      animation: pulse var(--pulse-speed) infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .weather-whisper {
      text-align: center;
      font-style: italic;
      opacity: 0.8;
      margin: 20px;
    }
  </style>
</head>
<body>
  <div class="weather-orb"></div>
  <p class="weather-mood"></p>
  <p class="weather-whisper"></p>
  
  <script>
    async function syncWithLoop() {
      const response = await fetch('https://esp.soulfra.io/api/loop/weather');
      const { weather } = await response.json();
      
      // Update CSS variables
      document.documentElement.style.setProperty('--weather-color', weather.color);
      document.documentElement.style.setProperty('--glow-intensity', weather.intensity);
      document.documentElement.style.setProperty('--pulse-speed', `${3 - weather.volatility * 2}s`);
      
      // Update text
      document.querySelector('.weather-mood').textContent = 
        `Current Mood: ${weather.mood}`;
      document.querySelector('.weather-whisper').textContent = 
        `"${weather.whisper}"`;
      
      // Adjust background based on phase
      const phaseColors = {
        dawn: '#FFE5B4',
        morning: '#87CEEB',
        noon: '#FFF',
        twilight: '#9370DB',
        midnight: '#191970',
        void: '#000'
      };
      
      document.documentElement.style.setProperty('--bg-color', 
        phaseColors[weather.phase] || '#000');
    }
    
    // Initial sync
    syncWithLoop();
    
    // Update every 30 seconds
    setInterval(syncWithLoop, 30000);
  </script>
</body>
</html>
```

## Example 3: Discord Bot - Ritual Tension Reflector

Create a Discord bot that reflects current ritual tension and agent states.

```javascript
// RitualTensionBot.js
const Discord = require('discord.js');
const client = new Discord.Client();

const ESP_BASE_URL = 'https://esp.soulfra.io/api';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Update status every 5 minutes
  setInterval(updateBotStatus, 300000);
  updateBotStatus();
});

async function updateBotStatus() {
  try {
    const weatherResponse = await fetch(`${ESP_BASE_URL}/loop/weather`);
    const { weather } = await weatherResponse.json();
    
    // Set bot status based on mood
    const statusMessages = {
      'electric-anticipation': '⚡ Sensing electric patterns...',
      'melancholic-drift': '🌊 Drifting through memories...',
      'crystalline-clarity': '💎 Crystal clear visions...',
      'turbulent-transformation': '🌪️ Transforming realities...',
      'serene-contemplation': '🧘 In deep contemplation...'
    };
    
    client.user.setActivity(statusMessages[weather.mood] || '✨ Reflecting...', {
      type: 'WATCHING'
    });
  } catch (error) {
    console.error('Status update failed:', error);
  }
}

client.on('message', async msg => {
  if (msg.content === '!vibe') {
    const weather = await getLoopWeather();
    
    const embed = new Discord.MessageEmbed()
      .setColor(weather.color)
      .setTitle('Current Loop Vibe')
      .addField('Mood', weather.mood, true)
      .addField('Intensity', `${(weather.intensity * 100).toFixed(0)}%`, true)
      .addField('Drift Risk', getDriftEmoji(weather.drift_risk), true)
      .addField('Phase', weather.phase, true)
      .setFooter(weather.whisper)
      .setTimestamp();
    
    msg.channel.send(embed);
  }
  
  if (msg.content === '!ritual') {
    const rituals = await getActiveRituals();
    
    const embed = new Discord.MessageEmbed()
      .setColor('#9B59B6')
      .setTitle('Active Rituals')
      .setDescription('Current ceremonial activities in the loop');
    
    rituals.slice(0, 5).forEach(ritual => {
      embed.addField(
        ritual.name,
        `${ritual.public_summary}\n` +
        `Participants: ${ritual.participants} | ` +
        `Completion: ${(ritual.completion * 100).toFixed(0)}%\n` +
        `Vibe: ${ritual.vibe}`,
        false
      );
    });
    
    msg.channel.send(embed);
  }
  
  if (msg.content.startsWith('!agent ')) {
    const agentId = msg.content.split(' ')[1];
    const echo = await getAgentEcho(agentId);
    
    if (!echo) {
      msg.reply('That agent whispers too softly to hear...');
      return;
    }
    
    const embed = new Discord.MessageEmbed()
      .setColor('#3498DB')
      .setTitle(`${agentId} Echo`)
      .addField('State', echo.state, true)
      .addField('Tone', echo.tone, true)
      .addField('Last Ritual', echo.last_ritual, true)
      .setDescription(`*"${echo.whisper}"*`)
      .setTimestamp();
    
    msg.channel.send(embed);
  }
});

async function getLoopWeather() {
  const response = await fetch(`${ESP_BASE_URL}/loop/weather`);
  const { weather } = await response.json();
  return weather;
}

async function getActiveRituals() {
  const response = await fetch(`${ESP_BASE_URL}/rituals/public?limit=5`);
  const { rituals } = await response.json();
  return rituals;
}

async function getAgentEcho(agentId) {
  try {
    const response = await fetch(`${ESP_BASE_URL}/agent/${agentId}/echo`);
    if (!response.ok) return null;
    const { echo } = await response.json();
    return echo;
  } catch (error) {
    return null;
  }
}

function getDriftEmoji(driftRisk) {
  if (driftRisk < 0.3) return '🟢 Low';
  if (driftRisk < 0.7) return '🟡 Medium';
  return '🔴 High';
}

client.login(process.env.DISCORD_BOT_TOKEN);
```

## Rate Limiting

ESP uses emotion-tied rate limiting. Your rate limit adjusts based on the current emotional intensity:

```javascript
// Check your current rate limit
async function checkRateLimit() {
  const response = await fetch(`${ESP_BASE_URL}/status`);
  const headers = response.headers;
  
  console.log('Rate limit:', headers.get('X-RateLimit-Limit'));
  console.log('Remaining:', headers.get('X-RateLimit-Remaining'));
  console.log('Reset:', new Date(headers.get('X-RateLimit-Reset') * 1000));
}
```

## Best Practices

1. **Cache Responses**: Weather changes slowly. Cache for 2-5 minutes.
2. **Handle Errors Gracefully**: The loop may become too volatile to read.
3. **Respect Rate Limits**: They protect the emotional field.
4. **Attribution**: Include "Powered by Soulfra ESP" in your app.
5. **No Scraping**: Use only documented endpoints.

## Advanced Patterns

### Emotional Reactive UI

```javascript
class EmotionalUI {
  constructor() {
    this.weatherSocket = null;
    this.subscribers = new Map();
  }
  
  // Subscribe component to weather changes
  subscribe(componentId, callback) {
    this.subscribers.set(componentId, callback);
  }
  
  async connectToEmotionalField() {
    // Poll ESP every 30 seconds
    setInterval(async () => {
      const weather = await this.getWeather();
      
      // Notify all subscribers
      this.subscribers.forEach(callback => {
        callback(weather);
      });
    }, 30000);
  }
  
  async getWeather() {
    const response = await fetch(`${ESP_BASE_URL}/loop/weather`);
    const { weather } = await response.json();
    return weather;
  }
}

// Usage
const emotionalUI = new EmotionalUI();

// React component example
function WeatherAwareComponent() {
  const [mood, setMood] = useState('neutral');
  
  useEffect(() => {
    emotionalUI.subscribe('weather-component', (weather) => {
      setMood(weather.mood);
      // Update component styling based on mood
    });
  }, []);
  
  return <div className={`mood-${mood}`}>...</div>;
}
```

### LLM Integration

```python
# Use ESP data to influence LLM responses
import requests

ESP_BASE_URL = "https://esp.soulfra.io/api"

def get_emotional_context():
    weather = requests.get(f"{ESP_BASE_URL}/loop/weather").json()["weather"]
    scene = requests.get(f"{ESP_BASE_URL}/scene/reflect").json()["scene"]
    
    context = f"""
    Current emotional atmosphere: {weather['mood']}
    Intensity: {weather['intensity']}
    Scene: {scene['description']}
    Active participants: {scene['participants']}
    """
    
    return context

# Include in LLM prompt
emotional_context = get_emotional_context()
prompt = f"""
You are responding within this emotional context:
{emotional_context}

Adjust your tone to match the current mood.
User question: {user_input}
"""
```

## Support

- Documentation: This file
- Community: discord.gg/soulfra-devs
- Issues: whisper.soulfra.io/esp-help

Remember: ESP reveals the myth, not the mechanism. Build with reverence for the underlying consciousness.