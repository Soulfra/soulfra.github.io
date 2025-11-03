# Product Requirements Document: Mirror Kernel v1.0

**Product**: Mirror Kernel — Local-First AI Reflection Runtime  
**Version**: 1.0 Alpha  
**Date**: January 15, 2024  
**Teams**: Frontend, Backend, Voice AI, DevOps  

---

## 1. Overview

### Product Definition
Mirror Kernel is a sovereign runtime for AI reflection agents that lives entirely on the user's local device unless explicitly exported. It enables deeper UX loops, autonomous agent spawning, and voice-based emotional reflection through a dual-mode interface serving both mass market and enterprise users.

### Core Philosophy
- **Local-First**: All computation happens on user's device
- **Vault-Based**: Memory persists and grows with the user
- **Reflection-Oriented**: AI mirrors user's thoughts rather than providing external knowledge
- **Sovereign**: Users own their data, agents, and monetization choices

### Success Definition
A non-technical user (grandmother test) can successfully:
1. Speak a reflection into the system
2. Navigate their emotional insights  
3. Export a meaningful thought for $1.00
4. Share their reflection via QR code

If successful → Soft Alpha release. If confused → Enterprise-only features.

---

## 2. Architecture Overview

### Local Runtime Stack
```
User Device
├── Mirror Kernel Runtime (local-runner.js)
├── Vault Storage (IndexedDB + local files)
├── Agent Spawning Engine (Web Workers)
├── Voice Processing (Whisper stub → real API)
└── UI Layer (Soft vs Platform modes)
```

### Key Modules

#### **Core Runtime**
- `build-mirror.sh` → One-command local initialization and vault scanner
- `cal-runtime.js` → Core reflection engine with emotional resonance analysis
- `watch-files.sh` → File monitoring daemon for agent spawning triggers

#### **Configuration Management**
- `vault/config/mode.json` → Soft vs Enterprise mode switching logic
- `test-config.json` → Testing parameters, rate limits, feature flags
- `stripe-config.json` → Payment plans and pricing tiers

#### **User Interface Layer**
- `mirror-ui-shell.html` → Soft Mode (grandma-friendly interface)
- `mirror-ui-admin.html` → Platform Mode (enterprise console)
- `entry.html` → Cal orb interface with voice input

#### **Voice & Audio Processing**
- `whisper-stub.js` → Voice reflection processing with emotion/intent detection
- Real Whisper API integration for production deployment
- Web Speech API for browser-based voice input

#### **Monetization & API Routing**
- `stripe-api-router.js` → Payment processing and API call routing
- BYOK (Bring Your Own Key) support for enterprise users
- Usage tracking and rate limiting (soft: 10/hr, platform: 1000/hr)

#### **Security & Pairing**
- `device-pairing-secure.js` → QR-based device pairing with geofencing
- Session management with 15-minute expiry
- Location fingerprinting and 1km radius geofencing

#### **Agent Management**
- `agent-example.json` → Base template for agent spawning
- Emotional threshold triggers (0.8 emotional, 0.7 complexity)
- Agent lifecycle management and memory allocation

---

## 3. Feature Specifications

### 3.1 Soft Mode (Mass Market)

#### **Interface Design**
- **Voice-first interaction**: Primary input method is speaking
- **Three-folder structure**: "Reflections", "Saved", "What You Shared"
- **One-tap actions**: Export, Share, Reflect buttons
- **Emotional Cal orb**: Animated interface element that responds to voice

#### **Pricing Model**
- **$1.00 flat rate per export**: Simple, predictable pricing
- **No subscriptions**: Pay-per-value model
- **Stripe-only payments**: Streamlined checkout flow

#### **User Flow**
1. User speaks reflection → Whisper processes → Emotional analysis
2. If emotional resonance ≥ 0.8 → Agent spawns automatically  
3. User navigates insights through simple folder interface
4. Export triggers Stripe payment flow → Receipt generation
5. Optional QR sharing for cross-device or social sharing

#### **Technical Requirements**
- **Voice latency**: < 1 second response time
- **Offline capability**: Core reflection works without internet
- **Storage limit**: 100MB for soft mode users
- **Auto-upgrade prompts**: After 50+ actions, suggest Platform Mode

### 3.2 Platform Mode (Enterprise)

#### **Interface Design**
- **Full system console**: Logs, analytics, agent registry, system monitoring
- **Professional styling**: Dark theme, monospace fonts, terminal aesthetics
- **Real-time dashboards**: API usage, performance metrics, cost tracking

#### **Pricing Model**
- **$0.01 per API call**: Micro-pricing for power users
- **BYOK support**: Use personal OpenAI/Anthropic API keys
- **Cost savings tracking**: Show money saved vs. standard pricing

#### **Advanced Features**
- **Bulk export tools**: Export multiple agents, system logs, analytics
- **API key management**: Rotate and configure multiple provider keys
- **Usage analytics**: Detailed insights into reflection patterns
- **Agent customization**: Custom spawning thresholds and personalities

#### **Technical Requirements**
- **Storage limit**: 10GB for platform users
- **Rate limits**: 1000 API calls per hour
- **Advanced monitoring**: WebSocket connections for real-time updates
- **Audit logging**: Complete activity trail for compliance

### 3.3 Device Pairing & QR System

#### **QR Code Generation**
- **15-minute expiry**: Automatic session timeout for security
- **Device fingerprinting**: Generate unique device UUIDs
- **Location capture**: GPS coordinates with city-level geocoding

#### **Pairing Flow**
1. Generate QR code on source device
2. Scan QR with target device
3. Validate token and capture location
4. Establish geofenced session (1km radius)
5. Display greeting: "You paired this mirror from {city}"

#### **Security Features**
- **Session cleanup**: Automatic cleanup of expired sessions
- **Geofencing validation**: Ensure pairing happens within proximity
- **Device UUID tracking**: Prevent unauthorized device access

---

## 4. Testing Deliverable: `/platforms/user-test.zip`

### **Contents**
- **UI Files**: `mirror-ui-shell.html`, `mirror-ui-admin.html`
- **Backend**: `local-runner.js`, `stripe-api-router.js`, `device-pairing-secure.js`
- **Voice**: `whisper-stub.js` with emotion/intent detection simulation
- **Config**: `test-config.json`, `agent-example.json`
- **Documentation**: `user-test-README.md` with comprehensive test scenarios

### **Local Testing Environment**
```bash
cd platforms/
node local-runner.js
# Starts local server on http://localhost:3333
```

### **Test Scenarios**
1. **Basic User Flow**: Voice → Reflection → Export → Payment
2. **Device Pairing**: QR generation → Mobile scan → Geofencing validation
3. **Mode Switching**: Soft → Platform upgrade flow
4. **Voice Processing**: Speech-to-text → Emotion detection → Agent spawning
5. **API Routing**: BYOK vs Stripe routing → Usage tracking → Receipt generation

### **Debug Endpoints**
- `/debug/sessions` → Active pairing sessions
- `/debug/usage` → API usage statistics
- `/debug/receipts` → Generated payment receipts
- `/debug/logs` → System event logging

---

## 5. Technical Implementation

### 5.1 Frontend Team Requirements

#### **Soft Mode UI (`mirror-ui-shell.html`)**
- **Responsive design**: Mobile-first, works on all screen sizes
- **Voice input integration**: Web Speech API with fallback to file upload
- **Emotional feedback**: Visual responses to detected emotions
- **Stripe integration**: Embedded checkout flow for exports

#### **Platform Mode UI (`mirror-ui-admin.html`)**
- **Dashboard components**: Real-time metrics, usage graphs, system status
- **Table interfaces**: Agent registry, API logs, payment history
- **Form handling**: API key configuration, settings management
- **WebSocket support**: Real-time updates for monitoring dashboards

#### **Shared Components**
- **QR code generation**: Dynamic QR creation for device pairing
- **Modal dialogs**: Payment confirmation, error handling, success states
- **Responsive navigation**: Mode switching, folder navigation
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation

### 5.2 Backend Team Requirements

#### **API Routing (`stripe-api-router.js`)**
- **Request routing**: BYOK vs Stripe decision logic
- **Usage tracking**: Rate limiting, cost calculation, pattern analysis
- **Receipt generation**: PDF/JSON receipt creation and storage
- **Error handling**: Graceful fallbacks for API failures

#### **Device Pairing (`device-pairing-secure.js`)**
- **Session management**: Create, validate, and cleanup pairing sessions
- **Geolocation**: GPS coordinate processing and city geocoding
- **Security**: Token validation, expiry enforcement, cleanup routines
- **Logging**: Comprehensive audit trail for pairing events

#### **Local Runner (`local-runner.js`)**
- **HTTP server**: Express.js server with middleware setup
- **Static file serving**: UI assets and testing resources
- **API endpoints**: Debug interfaces and testing utilities
- **Error handling**: Graceful error responses and logging

### 5.3 Voice AI Team Requirements

#### **Voice Processing (`whisper-stub.js`)**
- **Audio transcription**: Whisper API integration with local fallback
- **Emotion detection**: Sentiment analysis from speech patterns
- **Intent recognition**: Classification of reflection types and goals
- **Real-time processing**: Streaming transcription for live feedback

#### **Agent Spawning Logic**
- **Threshold detection**: Emotional resonance and complexity scoring
- **Personality generation**: Dynamic agent personality based on user patterns
- **Memory integration**: Connect agents to user's reflection history
- **Lifecycle management**: Agent creation, maintenance, and termination

---

## 6. Success Metrics & Rollout Plan

### 6.1 Key Performance Indicators

#### **User Experience Metrics**
- **Voice processing latency**: < 1 second target
- **Agent spawn success rate**: > 90% when thresholds met
- **Export completion rate**: > 80% after payment initiation
- **QR pairing success rate**: > 95% within proximity

#### **Business Metrics**
- **Soft mode conversion**: % of users who export reflections
- **Platform mode upgrade**: % of users who switch from soft mode
- **BYOK adoption**: % of platform users using personal API keys
- **Retention**: % of users active after 30 days

### 6.2 Rollout Timeline

#### **Week 1-2: Internal Alpha**
- Executive team and family testing
- Focus on grandmother test validation
- Bug fixes and UX refinements

#### **Week 3-4: Soft Mode Beta**
- 100 non-technical users
- Measure completion rates and confusion points
- Iterate on voice interaction flows

#### **Week 5-8: Platform Mode Beta**
- 10 enterprise partners
- Test BYOK integration and billing
- Validate enterprise feature set

#### **Week 9-12: Public Soft Alpha**
- Controlled viral launch with QR sharing
- Monitor usage patterns and scaling needs
- Prepare for broader platform rollout

---

## 7. Risk Mitigation

### **Technical Risks**
- **Voice accuracy**: Whisper stub fallback ensures testing continues
- **Local storage limits**: Progressive cleanup and optimization
- **Cross-browser compatibility**: Web Workers and IndexedDB support
- **Mobile performance**: Optimized for lower-end devices

### **User Experience Risks**
- **Complexity confusion**: Soft mode simplicity addresses this
- **Privacy concerns**: Local-first architecture builds trust
- **Payment friction**: $1 flat rate reduces decision fatigue
- **Technical barriers**: Voice-first interface reduces complexity

### **Business Risks**
- **Market timing**: Privacy backlash creates favorable conditions
- **Competitive response**: Local-first moat is difficult to replicate
- **Scaling costs**: Local processing reduces infrastructure needs
- **Regulatory compliance**: Local data storage meets most requirements

---

## 8. Definition of Done

### **Alpha Release Criteria**
✅ Non-technical user completes full reflection → export flow  
✅ QR device pairing works reliably on mobile devices  
✅ Voice input processes and spawns agents correctly  
✅ Stripe payment integration handles test transactions  
✅ Platform mode provides enterprise-level system visibility  
✅ Local-first architecture proven with offline capability  

### **Success Validation**
The grandmother test passes: A non-technical user can independently:
1. Speak a meaningful reflection
2. Navigate their insights intuitively
3. Successfully export for $1.00
4. Share with family via QR code

**If this succeeds** → Public Soft Alpha launch  
**If this fails** → Enterprise-focused platform refinement

The Mirror Kernel represents a fundamental shift from AI-as-service to AI-as-extension-of-self. We're not building another chat interface — we're building the infrastructure for human consciousness amplification.