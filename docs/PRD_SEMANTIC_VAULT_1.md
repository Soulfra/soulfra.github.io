# PRD: Semantic File Vault System

## Product Overview

The Semantic File Vault is an AI-powered knowledge management system that automatically organizes ideas from any file type into a living, interconnected knowledge graph.

## Current Implementation Status: ✅ BACKEND COMPLETE, ⚠️ FRONTEND PARTIAL

### What's Built:
- **SemanticFileVault.js**: Full backend implementation
- **Idea extraction**: Regex-based pattern matching
- **Semantic clustering**: Distance-based grouping
- **Graph generation**: Neo4j-style data structure
- **Cal's analysis**: AI personality responses

### What's Missing:
- **Frontend upload UI**: Needs connection to backend
- **Live graph display**: Vis.js setup incomplete
- **Real-time updates**: WebSocket integration needed

## User Stories

### Story 1: Idea Extraction
**As a** user with scattered ideas across documents  
**I want to** drop files into a vault  
**So that** Cal can extract and organize my thoughts automatically

**Acceptance Criteria**:
- ✅ Drag and drop file interface
- ✅ Support for .txt, .md, .doc files
- ✅ Real-time processing feedback
- ✅ No file size limits under 10MB

### Story 2: Knowledge Visualization
**As a** visual thinker  
**I want to** see my ideas as an interactive graph  
**So that** I can discover hidden connections

**Acceptance Criteria**:
- ⚠️ Live Neo4j-style visualization
- ⚠️ Clickable nodes showing idea details
- ⚠️ Colored clusters by theme
- ⚠️ Zoom/pan navigation

### Story 3: Cal's Intelligence
**As a** user seeking insights  
**I want** Cal to analyze my content  
**So that** I get AI-powered observations about patterns

**Acceptance Criteria**:
- ✅ Personality-driven responses
- ✅ Pattern identification
- ✅ Suggested connections
- ✅ Insight prioritization

## Technical Architecture

### Backend (IMPLEMENTED)
```javascript
class SemanticFileVault {
  - processDroppedFiles(files)
  - extractIdeas(content)
  - performSemanticClustering(ideas)
  - getGraphVisualization()
  - generateCalInsights(clusters)
}
```

### Frontend (NEEDS COMPLETION)
```javascript
// Required connections:
1. File upload to /api/vault/upload
2. WebSocket subscription for updates
3. Vis.js network initialization
4. Cal's insight panel updates
```

## API Specification

### Upload Files
```
POST /api/vault/upload
Content-Type: multipart/form-data
Body: files[]

Response: {
  success: true,
  filesProcessed: 3,
  ideasExtracted: 27,
  clusters: 5,
  graphState: { nodes: [], edges: [] },
  calInsights: []
}
```

### Get Graph Data
```
GET /api/vault/graph

Response: {
  nodes: [
    { id: "idea_1", label: "AI Healthcare", group: "cluster_1" }
  ],
  edges: [
    { from: "idea_1", to: "idea_2", value: 0.8 }
  ]
}
```

## Implementation Guide

### Step 1: Test Backend Directly
```bash
# Verify SemanticFileVault works
node -e "
const SFV = require('./vault/SemanticFileVault');
const vault = new SFV();
vault.processDroppedFiles([{
  name: 'test.txt',
  content: 'AI will transform healthcare. Machine learning enables diagnosis.'
}]).then(result => console.log(JSON.stringify(result, null, 2)));
"
```

### Step 2: Complete Frontend Integration
```javascript
// In index-production.html, add:
async function handleFiles(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  
  const response = await fetch('/api/vault/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  updateVaultGraph(result.graphState);
  updateInsights(result.calInsights);
}
```

### Step 3: Wire Up Visualization
```javascript
// Initialize vis.js with data
function updateVaultGraph(graphData) {
  vaultNodes.clear();
  vaultEdges.clear();
  
  graphData.nodes.forEach(node => {
    vaultNodes.add({
      id: node.id,
      label: node.title,
      color: getColorForCluster(node.group)
    });
  });
  
  graphData.edges.forEach(edge => {
    vaultEdges.add(edge);
  });
}
```

## Success Metrics

### Quantitative
- File processing time < 2 seconds
- Idea extraction accuracy > 80%
- Graph renders in < 1 second
- Cluster quality score > 0.7

### Qualitative
- Users report "aha!" moments
- Cal's insights feel helpful
- Graph reveals unexpected connections
- System feels magical, not mechanical

## Known Issues & Workarounds

### Issue 1: Frontend Not Connected
**Workaround**: Use backend demo mode
```bash
npm run demo
# Select option 2: Semantic File Vault Demo
```

### Issue 2: Graph Not Displaying
**Workaround**: Use alternate visualization
```bash
open dashboard/reflect/graph.html
# Manually load test data
```

### Issue 3: Files Not Uploading
**Workaround**: Direct API test
```bash
curl -X POST http://localhost:3000/api/vault/upload \
  -F "files=@test.txt"
```

## Next Steps

1. **Immediate**: Complete frontend handleFiles function
2. **Short-term**: Connect vis.js to live data
3. **Medium-term**: Add more file types (.pdf, .docx)
4. **Long-term**: Implement vector embeddings for better clustering