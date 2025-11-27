// ===== PACKAGE.JSON =====
{
  "name": "soulfra-web-orchestrator",
  "version": "1.0.0",
  "description": "Chat-driven AI development pipeline",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "deploy": "vercel deploy --prod"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "@supabase/supabase-js": "^2.38.0",
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "@octokit/rest": "^20.0.0",
    "qrcode": "^1.5.3",
    "uuid": "^9.0.0",
    "formidable": "^3.5.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "marked": "^9.1.0",
    "tailwindcss": "^3.3.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}

// ===== MAIN LANDING PAGE (pages/index.js) =====
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Github, Code, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 40%)`
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2"
          >
            <Brain className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold">Soulfra</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center space-x-4"
          >
            <Link href="/docs" className="text-gray-300 hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/auth/qr" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              Login
            </Link>
          </motion.div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
        <div className="text-center">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Chat Your Way to Code
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The first AI development platform you simply <em>talk to</em>. 
              From scattered documents to deployed applications through conversation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/begin">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center space-x-2 shadow-2xl"
                >
                  <span>Begin Building</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              
              <Link href="/demo">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
                >
                  Watch Demo
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Feature Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chat Interface</h3>
                <p className="text-gray-400">Simply describe what you want to build</p>
              </div>
              
              <div className="text-center">
                <Zap className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Orchestration</h3>
                <p className="text-gray-400">AI executes entire development pipeline</p>
              </div>
              
              <div className="text-center">
                <Code className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Auto-Deploy</h3>
                <p className="text-gray-400">From chat to production automatically</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Demo Chat Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-400">Soulfra AI Development Chat</span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  You
                </div>
                <div className="bg-blue-600/20 rounded-lg p-3 max-w-sm">
                  Build me an agent marketplace with payment integration
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="bg-gray-800 rounded-lg p-3 flex-1">
                  <p className="mb-2">I'll build your agent marketplace! Analyzing your documents...</p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Found 12 PRDs related to agent marketplace</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Generating system architecture</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span>Creating payment integration with Stripe</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Setting up GitHub repository...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center py-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Development Workflow?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join the future of AI-driven development
          </p>
          <Link href="/begin">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl text-xl font-semibold shadow-2xl"
            >
              Start Building Now
            </motion.button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

// ===== BEGIN PAGE (pages/begin.js) =====
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Upload, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';

export default function BeginPage() {
  const [step, setStep] = useState('upload'); // upload, processing, ready
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles(uploadedFiles);
    setProcessing(true);
    setStep('processing');

    // Simulate processing with progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('ready');
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    // Process files
    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append('files', file));
      
      const response = await fetch('/api/process-documents', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleFolderUpload = (event) => {
    const files = Array.from(event.target.files);
    setFiles(files);
    handleFileUpload(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Brain className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Begin Your AI Development Journey</h1>
          <p className="text-xl text-gray-300">
            Upload your documents and let AI orchestrate your entire development pipeline
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700"
            >
              <h2 className="text-2xl font-bold mb-6 text-center">Upload Your Documentation</h2>
              
              <div className="space-y-6">
                {/* Drag and Drop Area */}
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop your Soulfra-Documentation folder here</h3>
                  <p className="text-gray-400 mb-4">Or click to browse files</p>
                  
                  <input
                    type="file"
                    multiple
                    webkitdirectory=""
                    onChange={handleFolderUpload}
                    className="hidden"
                    id="folder-upload"
                  />
                  
                  <label
                    htmlFor="folder-upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer inline-block transition-colors"
                  >
                    Select Folder
                  </label>
                </div>

                {/* Individual Files */}
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Or upload individual files:</p>
                  
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <label
                    htmlFor="file-upload"
                    className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-6 py-3 rounded-lg cursor-pointer inline-block transition-colors"
                  >
                    Select Files
                  </label>
                </div>

                {/* Supported Formats */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Supported Formats:</h4>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                    <span className="bg-blue-600/20 px-2 py-1 rounded">PDF</span>
                    <span className="bg-green-600/20 px-2 py-1 rounded">DOCX</span>
                    <span className="bg-purple-600/20 px-2 py-1 rounded">TXT</span>
                    <span className="bg-orange-600/20 px-2 py-1 rounded">MD</span>
                    <span className="bg-red-600/20 px-2 py-1 rounded">Images</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 text-center"
            >
              <Loader2 className="h-16 w-16 text-blue-400 mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold mb-4">Processing Your Documents</h2>
              <p className="text-gray-300 mb-8">AI is analyzing your knowledge base and setting up your development environment</p>
              
              {/* Progress Bar */}
              <div className="bg-gray-700 rounded-full h-4 mb-6 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              {/* Processing Steps */}
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Uploaded {files.length} documents</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Extracted content and metadata</span>
                </div>
                <div className="flex items-center space-x-3">
                  {progress > 50 ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  )}
                  <span>Building knowledge graph</span>
                </div>
                <div className="flex items-center space-x-3">
                  {progress > 80 ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  )}
                  <span>Training AI assistant</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 text-center"
            >
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Your AI Development Environment is Ready!</h2>
              <p className="text-gray-300 mb-8">
                Processed {files.length} documents. Your AI assistant now understands your complete vision.
              </p>
              
              <motion.button
                onClick={() => router.push('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center space-x-2 mx-auto shadow-2xl"
              >
                <span>Start Chatting with AI</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== MAIN DASHBOARD WITH CHAT (pages/dashboard.js) =====
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Send, Paperclip, Settings, Github, Code, 
  Zap, FileText, Users, BarChart3, Loader2 
} from 'lucide-react';
import io from 'socket.io-client';

export default function Dashboard() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI development assistant. I've analyzed your documents and I'm ready to help you build Soulfra. What would you like to create today?",
      timestamp: new Date(),
      status: 'delivered'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('/api/socketio');
    setSocket(newSocket);

    newSocket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
    });

    newSocket.on('pipeline-update', (update) => {
      setPipelineStatus(update);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !socket) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Send to AI orchestrator
    socket.emit('chat-message', {
      message: inputMessage,
      context: 'development'
    });
  };

  const quickActions = [
    { text: "Build agent marketplace", icon: Users },
    { text: "Create trust federation system", icon: Zap },
    { text: "Generate API documentation", icon: FileText },
    { text: "Set up payment integration", icon: BarChart3 }
  ];

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold">Soulfra AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 bg-blue-600 rounded-lg flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Chat</span>
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-lg flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-lg flex items-center space-x-2">
              <Github className="h-4 w-4" />
              <span>Repositories</span>
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-lg flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Deployments</span>
            </button>
          </div>
        </nav>

        {/* Pipeline Status */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold mb-2">Pipeline Status</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>GitHub Sync</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span>Cursor IDE</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span>Testing</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI Development Assistant</h2>
              <p className="text-sm text-gray-400">Trained on your Soulfra documentation</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-700 rounded-lg">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.type === 'ai' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Brain className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium">Soulfra AI</span>
                    </div>
                  )}
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-100'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Pipeline Updates */}
                    {message.pipelineUpdates && (
                      <div className="mt-3 space-y-2">
                        {message.pipelineUpdates.map((update, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${
                              update.status === 'completed' ? 'bg-green-400' :
                              update.status === 'in-progress' ? 'bg-yellow-400 animate-pulse' :
                              'bg-gray-400'
                            }`}></div>
                            <span className="text-gray-300">{update.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Brain className="h-3 w-3" />
                </div>
                <div className="bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(action.text)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <action.icon className="h-3 w-3" />
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-gray-800 border-t border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-700 rounded-lg">
              <Paperclip className="h-4 w-4 text-gray-400" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Describe what you want to build..."
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-blue-500 placeholder-gray-400"
              />
              
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== API ENDPOINTS =====

// ===== DOCUMENT PROCESSING API (pages/api/process-documents.js) =====
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: './temp-uploads',
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];

    // Process each file
    const processedDocuments = [];
    
    for (const file of uploadedFiles) {
      if (!file) continue;

      const document = await processDocument(file);
      processedDocuments.push(document);

      // Clean up temp file
      fs.unlinkSync(file.filepath);
    }

    // Store in database (implement your database logic here)
    await storeDocuments(processedDocuments);

    res.status(200).json({
      success: true,
      processed: processedDocuments.length,
      documents: processedDocuments
    });

  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ error: 'Failed to process documents' });
  }
}

async function processDocument(file) {
  const content = await extractContent(file);
  const category = categorizeDocument(file.originalFilename, content);
  const concepts = extractConcepts(content);
  
  return {
    id: uuidv4(),
    filename: file.originalFilename,
    category,
    content,
    concepts,
    summary: generateSummary(content),
    processedAt: new Date()
  };
}

async function extractContent(file) {
  const ext = path.extname(file.originalFilename).toLowerCase();
  const fileContent = fs.readFileSync(file.filepath, 'utf8');
  
  // Add content extraction logic based on file type
  switch (ext) {
    case '.txt':
    case '.md':
      return fileContent;
    case '.pdf':
      // Use pdf-parse library
      return fileContent;
    case '.docx':
      // Use mammoth library
      return fileContent;
    default:
      return fileContent;
  }
}

function categorizeDocument(filename, content) {
  const categories = {
    'PRDs': ['prd', 'product', 'requirements', 'feature'],
    'Architecture': ['architecture', 'system', 'design', 'technical'],
    'Business': ['business', 'strategy', 'revenue', 'market'],
    'Ideas': ['idea', 'brainstorm', 'concept', 'thought'],
    'Code': ['code', 'implementation', 'script', 'api'],
    'Research': ['research', 'analysis', 'competitor', 'study']
  };

  const text = (filename + ' ' + content).toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    const score = keywords.reduce((sum, keyword) => {
      return sum + (text.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (score > 0) return category;
  }
  
  return 'Ideas';
}

function extractConcepts(content) {
  // Simple concept extraction - could be enhanced with NLP
  const concepts = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('#') || line.startsWith('##')) {
      concepts.push(line.replace(/#+\s*/, '').trim());
    }
  });
  
  return concepts.slice(0, 5);
}

function generateSummary(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.length > 0 ? sentences[0].trim() + '.' : 'No summary available';
}

async function storeDocuments(documents) {
  // Implement database storage logic
  // This would typically use your database of choice
  console.log('Storing documents:', documents.length);
}

// ===== CHAT API (pages/api/chat.js) =====
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;

    // Get relevant documents from knowledge base
    const relevantDocs = await findRelevantDocuments(message);

    // Create context-aware prompt
    const systemPrompt = `You are the Soulfra AI Development Assistant. You help users build the Soulfra platform by:

1. Understanding their documentation and requirements
2. Generating code and architecture recommendations  
3. Orchestrating development workflows
4. Integrating with GitHub, IDEs, and testing tools

Context from user's documents:
${relevantDocs.map(doc => `${doc.filename}: ${doc.summary}`).join('\n')}

Always be practical, actionable, and focused on shipping working code.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Check if response should trigger development pipeline
    const pipelineActions = await analyzePipelineActions(message, response);

    res.status(200).json({
      response,
      pipelineActions,
      relevantDocs: relevantDocs.map(doc => ({ 
        filename: doc.filename, 
        category: doc.category 
      }))
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
}

async function findRelevantDocuments(query) {
  // Implement document search logic
  // This would search your processed documents
  return [
    {
      filename: 'agent-marketplace-prd.md',
      category: 'PRDs',
      summary: 'Agent marketplace with payment integration and revenue sharing'
    }
  ];
}

async function analyzePipelineActions(message, response) {
  // Analyze if the conversation should trigger development actions
  const actions = [];
  
  if (message.toLowerCase().includes('build') || message.toLowerCase().includes('create')) {
    actions.push({
      type: 'code-generation',
      description: 'Generate code based on requirements'
    });
  }
  
  if (message.toLowerCase().includes('github') || message.toLowerCase().includes('repository')) {
    actions.push({
      type: 'github-setup',
      description: 'Set up GitHub repository'
    });
  }
  
  return actions;
}

// ===== SOCKET.IO API (pages/api/socketio.js) =====
import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected');

      socket.on('chat-message', async (data) => {
        try {
          // Process chat message with AI
          const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          // Send AI response back
          socket.emit('message', {
            id: Date.now(),
            type: 'ai',
            content: result.response,
            timestamp: new Date(),
            pipelineUpdates: result.pipelineActions?.map(action => ({
              status: 'in-progress',
              message: action.description
            }))
          });

          // Execute pipeline actions
          if (result.pipelineActions?.length > 0) {
            await executePipelineActions(result.pipelineActions, socket);
          }

        } catch (error) {
          console.error('Socket message error:', error);
          socket.emit('message', {
            id: Date.now(),
            type: 'ai',
            content: 'Sorry, I encountered an error processing your request.',
            timestamp: new Date()
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }
  res.end();
};

async function executePipelineActions(actions, socket) {
  for (const action of actions) {
    socket.emit('pipeline-update', {
      action: action.type,
      status: 'in-progress',
      message: action.description
    });

    // Simulate pipeline execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    socket.emit('pipeline-update', {
      action: action.type,
      status: 'completed',
      message: `${action.description} - completed`
    });
  }
}

export default SocketHandler;

// ===== DEPLOYMENT CONFIGURATION =====

// ===== VERCEL CONFIGURATION (vercel.json) =====
{
  "name": "soulfra-web-orchestrator",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "GITHUB_TOKEN": "@github-token"
  }
}

// ===== ENVIRONMENT VARIABLES (.env.local) =====
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here  
GITHUB_TOKEN=your_github_token_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

// ===== TAILWIND CONFIG (tailwind.config.js) =====
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'bounce': 'bounce 1s infinite',
      }
    },
  },
  plugins: [],
}

// ===== DEPLOYMENT SCRIPT (deploy.sh) =====
#!/bin/bash
echo "🚀 Deploying Soulfra Web Orchestrator..."

# Install dependencies
npm install

# Build the application  
npm run build

# Deploy to Vercel
npx vercel deploy --prod

echo "✅ Deployment complete!"
echo "🌐 Your Soulfra Web Orchestrator is live!"
echo "📋 Next steps:"
echo "  1. Set up environment variables in Vercel dashboard"
echo "  2. Configure domain (soulfra.ai)"
echo "  3. Test the complete pipeline"