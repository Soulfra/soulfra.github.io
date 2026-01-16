import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PublishedAgent {
  id: string;
  name: string;
  description: string;
  archetype: 'personal' | 'business' | 'creative' | 'developer' | 'research';
  githubRepo: string;
  qrCode?: string;
  stats: {
    forks: number;
    scans: number;
    revenue: number;
    rating: number;
  };
  status: 'draft' | 'published' | 'featured';
  lineage: {
    originRepo: string;
    parentAgents: string[];
    forkDepth: number;
  };
  capabilities: string[];
  createdAt: string;
  lastUpdated: string;
}

interface NewAgentForm {
  name: string;
  description: string;
  archetype: string;
  isPublic: boolean;
  enableQR: boolean;
  knowledgeFiles: File[];
}

export const AgentPublishingDashboard: React.FC = () => {
  const [agents, setAgents] = useState<PublishedAgent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userFingerprint, setUserFingerprint] = useState<string>('');
  const [userTier, setUserTier] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [publishingAgent, setPublishingAgent] = useState<string | null>(null);

  const [newAgent, setNewAgent] = useState<NewAgentForm>({
    name: '',
    description: '',
    archetype: 'personal',
    isPublic: true,
    enableQR: false,
    knowledgeFiles: []
  });

  useEffect(() => {
    // Get user fingerprint and load agents
    const fingerprint = localStorage.getItem('soulfra_user_fingerprint') || '';
    setUserFingerprint(fingerprint);
    
    // Load user tier from blessing progress
    const blessingProgress = localStorage.getItem('soulfra_blessing_progress');
    if (blessingProgress) {
      const progress = JSON.parse(blessingProgress);
      setUserTier(progress.currentTier || 4);
    }

    loadPublishedAgents();
  }, []);

  const loadPublishedAgents = async () => {
    try {
      const response = await fetch('/api/agents/published', {
        headers: {
          'X-User-Fingerprint': userFingerprint
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishNewAgent = async () => {
    if (!newAgent.name || !newAgent.description) return;

    setPublishingAgent(newAgent.name);

    try {
      // First, create the agent locally
      const agentResponse = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Fingerprint': userFingerprint
        },
        body: JSON.stringify({
          ...newAgent,
          tier: userTier,
          capabilities: getCapabilitiesForTier(userTier)
        })
      });

      if (!agentResponse.ok) throw new Error('Agent creation failed');
      
      const agentData = await agentResponse.json();

      // Then trigger GitHub publishing
      const githubResponse = await fetch('/api/github/publish-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Fingerprint': userFingerprint
        },
        body: JSON.stringify({
          agentId: agentData.id,
          agentName: newAgent.name,
          archetype: newAgent.archetype,
          blessingTier: userTier,
          isPublic: newAgent.isPublic
        })
      });

      if (!githubResponse.ok) throw new Error('GitHub publishing failed');
      
      const githubData = await githubResponse.json();

      // Generate QR code if enabled and user has Tier 6+
      let qrCodeUrl = null;
      if (newAgent.enableQR && userTier >= 6) {
        const qrResponse = await fetch('/api/qr/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Fingerprint': userFingerprint
          },
          body: JSON.stringify({
            agentId: agentData.id,
            type: 'agent_experience',
            metadata: {
              name: newAgent.name,
              description: newAgent.description
            }
          })
        });

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCodeUrl = qrData.qrCodeUrl;
        }
      }

      // Add to local agents list
      const publishedAgent: PublishedAgent = {
        id: agentData.id,
        name: newAgent.name,
        description: newAgent.description,
        archetype: newAgent.archetype as any,
        githubRepo: githubData.repoUrl,
        qrCode: qrCodeUrl,
        stats: { forks: 0, scans: 0, revenue: 0, rating: 0 },
        status: 'published',
        lineage: {
          originRepo: githubData.originRepo,
          parentAgents: [],
          forkDepth: 1
        },
        capabilities: getCapabilitiesForTier(userTier),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      setAgents(prev => [publishedAgent, ...prev]);
      
      // Reset form
      setNewAgent({
        name: '',
        description: '',
        archetype: 'personal',
        isPublic: true,
        enableQR: false,
        knowledgeFiles: []
      });
      setShowCreateForm(false);

    } catch (error) {
      console.error('Publishing failed:', error);
      alert('Agent publishing failed. Please try again.');
    } finally {
      setPublishingAgent(null);
    }
  };

  const getCapabilitiesForTier = (tier: number): string[] => {
    const baseCapabilities = ['Local processing', 'Voice whisper', 'Basic memory'];
    
    if (tier >= 5) baseCapabilities.push('Web search', 'API integrations');
    if (tier >= 6) baseCapabilities.push('QR monetization', 'Business features');
    if (tier >= 7) baseCapabilities.push('Code execution', 'Advanced integrations');
    if (tier >= 8) baseCapabilities.push('Enterprise features', 'Team management');
    
    return baseCapabilities;
  };

  const getArchetypeIcon = (archetype: string) => {
    const icons = {
      personal: '👤',
      business: '💼', 
      creative: '🎨',
      developer: '💻',
      research: '📚'
    };
    return icons[archetype as keyof typeof icons] || '🤖';
  };

  const getArchetypeColor = (archetype: string) => {
    const colors = {
      personal: 'from-blue-500 to-cyan-500',
      business: 'from-green-500 to-emerald-500',
      creative: 'from-purple-500 to-pink-500', 
      developer: 'from-orange-500 to-red-500',
      research: 'from-indigo-500 to-purple-500'
    };
    return colors[archetype as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your published agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🤖 Agent Publishing Dashboard</h1>
            <p className="text-gray-400">
              Manage your published agents and track their impact across the Soulfra network
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Your Blessing Tier</div>
              <div className="text-2xl font-bold text-purple-400">Tier {userTier}</div>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={userTier < 4}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                userTier >= 4
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {userTier >= 4 ? '+ Create New Agent' : 'Requires Tier 4+'}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">{agents.length}</div>
            <div className="text-gray-400">Published Agents</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {agents.reduce((sum, agent) => sum + agent.stats.forks, 0)}
            </div>
            <div className="text-gray-400">Total Forks</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-purple-400">
              {agents.reduce((sum, agent) => sum + agent.stats.scans, 0)}
            </div>
            <div className="text-gray-400">QR Scans</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">
              ${agents.reduce((sum, agent) => sum + agent.stats.revenue, 0).toFixed(2)}
            </div>
            <div className="text-gray-400">Revenue Earned</div>
          </div>
        </div>

        {/* Published Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-all"
              whileHover={{ scale: 1.02 }}
              layout
            >
              {/* Agent Header */}
              <div className={`bg-gradient-to-r ${getArchetypeColor(agent.archetype)} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getArchetypeIcon(agent.archetype)}</div>
                    <div>
                      <h3 className="font-bold text-lg">{agent.name}</h3>
                      <div className="text-sm opacity-90 capitalize">{agent.archetype}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    agent.status === 'featured' ? 'bg-yellow-500 text-black' :
                    agent.status === 'published' ? 'bg-green-500 text-black' :
                    'bg-gray-500 text-white'
                  }`}>
                    {agent.status}
                  </div>
                </div>
              </div>

              {/* Agent Content */}
              <div className="p-4">
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  {agent.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{agent.stats.forks}</div>
                    <div className="text-xs text-gray-400">Forks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{agent.stats.scans}</div>
                    <div className="text-xs text-gray-400">QR Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">${agent.stats.revenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">
                      {agent.stats.rating > 0 ? `${agent.stats.rating}/5` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-400">Rating</div>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-2">Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map(cap => (
                      <span key={cap} className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {cap}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        +{agent.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <a
                    href={agent.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-center text-sm transition-colors"
                  >
                    📂 View Repo
                  </a>
                  
                  {agent.qrCode && (
                    <button className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-center text-sm transition-colors">
                      📱 QR Code
                    </button>
                  )}
                </div>

                {/* Lineage Info */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    Fork depth: {agent.lineage.forkDepth} • 
                    Origin: <span className="text-blue-400">{agent.lineage.originRepo.split('/').pop()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty State */}
          {agents.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">No agents published yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first agent to start building your presence in the Soulfra network
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={userTier < 4}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  userTier >= 4
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {userTier >= 4 ? 'Create Your First Agent' : `Complete Tier 4 Blessing to Publish Agents`}
              </button>
            </div>
          )}
        </div>

        {/* Create Agent Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">🚀 Create New Agent</h2>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Agent Name</label>
                      <input
                        type="text"
                        value={newAgent.name}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="My Awesome Agent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Description</label>
                      <textarea
                        value={newAgent.description}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 h-24"
                        placeholder="Describe what your agent does and how it helps users..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Archetype</label>
                      <select
                        value={newAgent.archetype}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, archetype: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="personal">👤 Personal Assistant</option>
                        <option value="business">💼 Business Tool</option>
                        <option value="creative">🎨 Creative Companion</option>
                        <option value="developer">💻 Developer Helper</option>
                        <option value="research">📚 Research Assistant</option>
                      </select>
                    </div>

                    {/* Publishing Options */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={newAgent.isPublic}
                          onChange={(e) => setNewAgent(prev => ({ ...prev, isPublic: e.target.checked }))}
                          className="w-5 h-5"
                        />
                        <label htmlFor="isPublic" className="text-sm">
                          Make agent publicly discoverable in marketplace
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="enableQR"
                          checked={newAgent.enableQR}
                          onChange={(e) => setNewAgent(prev => ({ ...prev, enableQR: e.target.checked }))}
                          disabled={userTier < 6}
                          className="w-5 h-5"
                        />
                        <label htmlFor="enableQR" className="text-sm">
                          Enable QR code sharing 
                          {userTier < 6 && <span className="text-gray-400"> (Requires Tier 6+)</span>}
                        </label>
                      </div>
                    </div>

                    {/* Capabilities Preview */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Available Capabilities (Tier {userTier})
                      </label>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex flex-wrap gap-2">
                          {getCapabilitiesForTier(userTier).map(cap => (
                            <span key={cap} className="text-xs bg-purple-600 px-2 py-1 rounded">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-4">
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={publishNewAgent}
                        disabled={!newAgent.name || !newAgent.description || publishingAgent === newAgent.name}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishingAgent === newAgent.name ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Publishing...</span>
                          </div>
                        ) : (
                          'Publish Agent'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};