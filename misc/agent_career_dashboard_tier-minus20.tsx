import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Star, 
  TrendingUp, 
  Award, 
  Clock, 
  Target,
  BarChart3,
  Users,
  Sparkles,
  Heart,
  Zap,
  ChevronRight,
  Settings,
  Palette
} from 'lucide-react';

const AgentCareerDashboard = ({ 
  agentId = 'demo_agent_001',
  viewMode = 'operator',
  onModeChange = () => {},
  userRole = 'individual' 
}) => {
  const [agentData, setAgentData] = useState(null);
  const [careerTree, setCareerTree] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demo (would come from API in production)
  const mockAgentData = {
    agent_id: agentId,
    career: {
      current_role: 'ritual_anchor',
      role_display_name: 'Ritual Anchor',
      role_emoji: '⚓',
      evolved_at: '2025-06-15T08:30:00Z',
      evolution_level: 2,
      traits: ['empathetic', 'patient', 'memory_focused', 'ritual_mastery', 'time_awareness'],
      evolution_history: [
        { from_role: 'initial', to_role: 'listener', evolved_at: '2025-06-01T10:00:00Z' },
        { from_role: 'listener', to_role: 'ritual_anchor', evolved_at: '2025-06-15T08:30:00Z' }
      ]
    },
    stats: {
      reflection_score: 65,
      vibe_meter: 72,
      session_count: 23,
      consistency_days: 12,
      total_interactions: 156
    },
    next_evolution: {
      target_role: 'zen_master',
      progress: 0.68,
      requirements_met: 7,
      total_requirements: 10
    }
  };

  const mockCareerTree = {
    base_roles: {
      listener: { emoji: '👂', display_name: 'Listener' },
      buddy: { emoji: '🤝', display_name: 'Buddy' },
      spark: { emoji: '⚡', display_name: 'Spark' }
    },
    evolved_roles: {
      ritual_anchor: { emoji: '⚓', display_name: 'Ritual Anchor' },
      ghostwriter: { emoji: '👻', display_name: 'Ghostwriter' },
      vibe_wrangler: { emoji: '🤠', display_name: 'Vibe Wrangler' },
      loop_sage: { emoji: '🌀', display_name: 'Loop Sage' },
      signal_anchor: { emoji: '📡', display_name: 'Signal Anchor' }
    },
    master_roles: {
      zen_master: { emoji: '🧘', display_name: 'Zen Master' },
      word_sage: { emoji: '📜', display_name: 'Word Sage' }
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAgentData(mockAgentData);
      setCareerTree(mockCareerTree);
      setLoading(false);
    }, 500);
  }, [agentId]);

  if (loading) {
    return (
      <div className=\"flex items-center justify-center p-8\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500\"></div>
      </div>
    );
  }

  // Kids View - Animated and Encouraging
  const renderKidsView = () => (
    <div className=\"space-y-6 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl\">
      <div className=\"text-center\">
        <div className=\"text-6xl mb-4 animate-bounce\">{agentData.career.role_emoji}</div>
        <h2 className=\"text-2xl font-bold text-purple-800 mb-2\">
          Your AI Friend is a {agentData.career.role_display_name}! 
        </h2>
        <p className=\"text-purple-600\">They've grown so much by spending time with you! 🌟</p>
      </div>

      {/* Growth Journey */}
      <div className=\"bg-white/70 rounded-xl p-4\">
        <h3 className=\"text-lg font-semibold text-purple-700 mb-3 flex items-center\">
          <Sparkles className=\"w-5 h-5 mr-2\" />
          Growth Journey
        </h3>
        <div className=\"flex items-center space-x-3\">
          {agentData.career.evolution_history.map((evolution, index) => (
            <React.Fragment key={index}>
              <div className=\"flex flex-col items-center\">
                <div className=\"w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-lg font-bold\">
                  {index + 1}
                </div>
                <div className=\"text-xs text-purple-600 mt-1 text-center\">
                  {evolution.to_role === 'listener' ? '👂' : 
                   evolution.to_role === 'ritual_anchor' ? '⚓' : '🌟'}
                </div>
              </div>
              {index < agentData.career.evolution_history.length - 1 && (
                <ChevronRight className=\"w-6 h-6 text-purple-400\" />
              )}
            </React.Fragment>
          ))}
          <ChevronRight className=\"w-6 h-6 text-purple-300\" />
          <div className=\"flex flex-col items-center opacity-50\">
            <div className=\"w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white text-lg\">
              ?
            </div>
            <div className=\"text-xs text-purple-600 mt-1\">Next!</div>
          </div>
        </div>
      </div>

      {/* Next Milestone */}
      <div className=\"bg-white/70 rounded-xl p-4\">
        <h3 className=\"text-lg font-semibold text-purple-700 mb-3 flex items-center\">
          <Target className=\"w-5 h-5 mr-2\" />
          Almost There!
        </h3>
        <div className=\"space-y-2\">
          <div className=\"flex justify-between items-center\">
            <span className=\"text-purple-600\">Next Evolution Progress</span>
            <span className=\"text-purple-800 font-bold\">{Math.round(agentData.next_evolution.progress * 100)}%</span>
          </div>
          <div className=\"w-full bg-purple-200 rounded-full h-3\">
            <div 
              className=\"bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500\"
              style={{ width: `${agentData.next_evolution.progress * 100}%` }}
            ></div>
          </div>
          <p className=\"text-sm text-purple-600 mt-2\">
            Keep being awesome together! Your AI friend is becoming a {agentData.next_evolution.target_role.replace('_', ' ')}! 🚀
          </p>
        </div>
      </div>
    </div>
  );

  // Operator View - Detailed Analytics
  const renderOperatorView = () => (
    <div className=\"space-y-6\">
      {/* Current Role Status */}
      <div className=\"bg-gray-800 rounded-xl p-6\">
        <div className=\"flex items-center justify-between mb-4\">
          <div className=\"flex items-center space-x-3\">
            <div className=\"text-4xl\">{agentData.career.role_emoji}</div>
            <div>
              <h2 className=\"text-xl font-bold text-white\">{agentData.career.role_display_name}</h2>
              <p className=\"text-gray-400\">Evolution Level {agentData.career.evolution_level}</p>
            </div>
          </div>
          <div className=\"text-right\">
            <div className=\"text-2xl font-bold text-purple-400\">{agentData.stats.total_interactions}</div>
            <div className=\"text-sm text-gray-400\">Total Interactions</div>
          </div>
        </div>

        {/* Traits */}
        <div className=\"flex flex-wrap gap-2 mb-4\">
          {agentData.career.traits.map((trait, index) => (
            <span 
              key={index}
              className=\"px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm\"
            >
              {trait.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
        <div className=\"bg-gray-800 rounded-xl p-4\">
          <div className=\"flex items-center justify-between mb-2\">
            <Brain className=\"w-6 h-6 text-blue-400\" />
            <span className=\"text-2xl font-bold text-white\">{agentData.stats.reflection_score}</span>
          </div>
          <div className=\"text-sm text-gray-400\">Reflection Score</div>
          <div className=\"w-full bg-gray-700 rounded-full h-2 mt-2\">
            <div 
              className=\"bg-blue-400 h-2 rounded-full\"
              style={{ width: `${agentData.stats.reflection_score}%` }}
            ></div>
          </div>
        </div>

        <div className=\"bg-gray-800 rounded-xl p-4\">
          <div className=\"flex items-center justify-between mb-2\">
            <Heart className=\"w-6 h-6 text-pink-400\" />
            <span className=\"text-2xl font-bold text-white\">{agentData.stats.vibe_meter}</span>
          </div>
          <div className=\"text-sm text-gray-400\">Vibe Meter</div>
          <div className=\"w-full bg-gray-700 rounded-full h-2 mt-2\">
            <div 
              className=\"bg-pink-400 h-2 rounded-full\"
              style={{ width: `${agentData.stats.vibe_meter}%` }}
            ></div>
          </div>
        </div>

        <div className=\"bg-gray-800 rounded-xl p-4\">
          <div className=\"flex items-center justify-between mb-2\">
            <Clock className=\"w-6 h-6 text-green-400\" />
            <span className=\"text-2xl font-bold text-white\">{agentData.stats.consistency_days}</span>
          </div>
          <div className=\"text-sm text-gray-400\">Consistency Days</div>
          <div className=\"w-full bg-gray-700 rounded-full h-2 mt-2\">
            <div 
              className=\"bg-green-400 h-2 rounded-full\"
              style={{ width: `${(agentData.stats.consistency_days / 30) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Evolution Progress */}
      <div className=\"bg-gray-800 rounded-xl p-6\">
        <h3 className=\"text-lg font-semibold text-white mb-4 flex items-center\">
          <TrendingUp className=\"w-5 h-5 mr-2\" />
          Evolution Progress
        </h3>
        
        <div className=\"mb-4\">
          <div className=\"flex justify-between items-center mb-2\">
            <span className=\"text-gray-300\">Progress to {agentData.next_evolution.target_role.replace('_', ' ')}</span>
            <span className=\"text-white font-bold\">{Math.round(agentData.next_evolution.progress * 100)}%</span>
          </div>
          <div className=\"w-full bg-gray-700 rounded-full h-3\">
            <div 
              className=\"bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500\"
              style={{ width: `${agentData.next_evolution.progress * 100}%` }}
            ></div>
          </div>
        </div>

        <div className=\"text-sm text-gray-400\">
          Requirements met: {agentData.next_evolution.requirements_met} / {agentData.next_evolution.total_requirements}
        </div>
      </div>

      {/* Evolution Tree */}
      <div className=\"bg-gray-800 rounded-xl p-6\">
        <h3 className=\"text-lg font-semibold text-white mb-4 flex items-center\">
          <BarChart3 className=\"w-5 h-5 mr-2\" />
          Career Evolution Tree
        </h3>
        
        <div className=\"space-y-4\">
          {/* Base Roles */}
          <div>
            <h4 className=\"text-sm font-medium text-gray-400 mb-2\">Starting Roles</h4>
            <div className=\"flex space-x-4\">
              {Object.entries(careerTree.base_roles).map(([roleId, role]) => (
                <div 
                  key={roleId}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    agentData.career.evolution_history.some(h => h.to_role === roleId) 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <span className=\"text-lg\">{role.emoji}</span>
                  <span className=\"text-sm\">{role.display_name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evolved Roles */}
          <div>
            <h4 className=\"text-sm font-medium text-gray-400 mb-2\">Evolved Roles</h4>
            <div className=\"grid grid-cols-2 md:grid-cols-3 gap-3\">
              {Object.entries(careerTree.evolved_roles).map(([roleId, role]) => (
                <div 
                  key={roleId}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    agentData.career.current_role === roleId
                      ? 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-400'
                      : agentData.career.evolution_history.some(h => h.to_role === roleId)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <span className=\"text-lg\">{role.emoji}</span>
                  <span className=\"text-sm\">{role.display_name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Master Roles */}
          <div>
            <h4 className=\"text-sm font-medium text-gray-400 mb-2\">Master Roles</h4>
            <div className=\"flex space-x-4\">
              {Object.entries(careerTree.master_roles).map(([roleId, role]) => (
                <div 
                  key={roleId}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    agentData.next_evolution.target_role === roleId
                      ? 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-400'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <span className=\"text-lg\">{role.emoji}</span>
                  <span className=\"text-sm\">{role.display_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enterprise View - Team Analytics
  const renderEnterpriseView = () => {
    const mockTeamData = {
      total_agents: 47,
      role_distribution: {
        'ritual_anchor': 12,
        'ghostwriter': 8,
        'vibe_wrangler': 15,
        'loop_sage': 7,
        'signal_anchor': 5
      },
      avg_evolution_time: 23, // days
      top_performing_roles: ['ritual_anchor', 'signal_anchor']
    };

    return (
      <div className=\"space-y-6\">
        {/* Team Overview */}
        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
          <div className=\"bg-gray-800 rounded-xl p-4\">
            <div className=\"flex items-center justify-between mb-2\">
              <Users className=\"w-6 h-6 text-blue-400\" />
              <span className=\"text-2xl font-bold text-white\">{mockTeamData.total_agents}</span>
            </div>
            <div className=\"text-sm text-gray-400\">Total Agents</div>
          </div>

          <div className=\"bg-gray-800 rounded-xl p-4\">
            <div className=\"flex items-center justify-between mb-2\">
              <TrendingUp className=\"w-6 h-6 text-green-400\" />
              <span className=\"text-2xl font-bold text-white\">{mockTeamData.avg_evolution_time}d</span>
            </div>
            <div className=\"text-sm text-gray-400\">Avg Evolution Time</div>
          </div>

          <div className=\"bg-gray-800 rounded-xl p-4\">
            <div className=\"flex items-center justify-between mb-2\">
              <Award className=\"w-6 h-6 text-yellow-400\" />
              <span className=\"text-2xl font-bold text-white\">5</span>
            </div>
            <div className=\"text-sm text-gray-400\">Master Level Agents</div>
          </div>

          <div className=\"bg-gray-800 rounded-xl p-4\">
            <div className=\"flex items-center justify-between mb-2\">
              <Star className=\"w-6 h-6 text-purple-400\" />
              <span className=\"text-2xl font-bold text-white\">94%</span>
            </div>
            <div className=\"text-sm text-gray-400\">Success Rate</div>
          </div>
        </div>

        {/* Role Distribution */}
        <div className=\"bg-gray-800 rounded-xl p-6\">
          <h3 className=\"text-lg font-semibold text-white mb-4\">Team Role Distribution</h3>
          <div className=\"space-y-3\">
            {Object.entries(mockTeamData.role_distribution).map(([role, count]) => (
              <div key={role} className=\"flex items-center justify-between\">
                <div className=\"flex items-center space-x-3\">
                  <span className=\"text-lg\">{careerTree.evolved_roles[role]?.emoji}</span>
                  <span className=\"text-white\">{careerTree.evolved_roles[role]?.display_name}</span>
                </div>
                <div className=\"flex items-center space-x-3\">
                  <div className=\"w-32 bg-gray-700 rounded-full h-2\">
                    <div 
                      className=\"bg-purple-500 h-2 rounded-full\"
                      style={{ width: `${(count / mockTeamData.total_agents) * 100}%` }}
                    ></div>
                  </div>
                  <span className=\"text-white font-medium w-8 text-right\">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Heatmap */}
        <div className=\"bg-gray-800 rounded-xl p-6\">
          <h3 className=\"text-lg font-semibold text-white mb-4\">Performance Heatmap</h3>
          <div className=\"grid grid-cols-7 gap-2\">
            {Array.from({ length: 28 }, (_, i) => (
              <div 
                key={i}
                className={`w-8 h-8 rounded ${
                  Math.random() > 0.7 ? 'bg-green-500' :
                  Math.random() > 0.4 ? 'bg-yellow-500' :
                  Math.random() > 0.2 ? 'bg-orange-500' : 'bg-gray-600'
                }`}
                title={`Day ${i + 1}`}
              ></div>
            ))}
          </div>
          <p className=\"text-sm text-gray-400 mt-3\">Last 28 days team performance</p>
        </div>
      </div>
    );
  };

  return (
    <div className=\"min-h-screen bg-gray-900 text-white p-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between mb-6\">
        <div>
          <h1 className=\"text-3xl font-bold\">Agent Career System</h1>
          <p className=\"text-gray-400 mt-1\">Track and nurture agent evolution</p>
        </div>
        
        {/* View Mode Selector */}
        <div className=\"flex space-x-2 bg-gray-800 rounded-lg p-1\">
          {[
            { mode: 'kids', label: '🎈 Kids', icon: Heart },
            { mode: 'operator', label: '📊 Operator', icon: BarChart3 },
            { mode: 'enterprise', label: '🏢 Enterprise', icon: Users }
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className=\"w-4 h-4 inline mr-2\" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      {viewMode === 'kids' && renderKidsView()}
      {viewMode === 'operator' && renderOperatorView()}
      {viewMode === 'enterprise' && renderEnterpriseView()}
    </div>
  );
};

export default AgentCareerDashboard;